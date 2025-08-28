import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { User, UserRole, Address } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  login: (email: string, password?: string) => User | null;
  logout: () => void;
  register: (name: string, email: string, password?: string) => User | null;
  updateUser: (updates: Partial<Omit<User, 'id' | 'email' | 'role' | 'loyalty'>>) => void;
  resetPassword: (email: string, newPassword: string) => void;
  updateUserInfo: (userId: string, updates: { name: string }) => void;
  changePassword: (userId: string, oldPassword: string, newPassword: string) => boolean;
  addAddress: (userId: string, address: Omit<Address, 'id' | 'isDefault'>) => void;
  updateAddress: (userId: string, address: Address) => void;
  deleteAddress: (userId: string, addressId: string) => void;
  setDefaultAddress: (userId: string, addressId: string) => void;
  toggleFollowStore: (storeId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialUsers: User[] = [
    { id: 'assistant-id', name: 'Assistant KMER ZONE', email: 'assistant@kmerzone.com', password: 'password', role: 'customer', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [] },
    { id: 'seller-1', name: 'Kmer Fashion', email: 'seller@example.com', password: 'password', role: 'seller', shopName: 'Kmer Fashion', location: 'Douala', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [] },
    { id: 'seller-2', name: 'Mama Africa', email: 'mamaafrica@example.com', password: 'password', role: 'seller', shopName: 'Mama Africa', location: 'Yaoundé', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [] },
    { id: 'seller-3', name: 'Electro Plus', email: 'electro@example.com', password: 'password', role: 'seller', shopName: 'Electro Plus', location: 'Yaoundé', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [] },
    { id: 'seller-4', name: 'Douala Soaps', email: 'soaps@example.com', password: 'password', role: 'seller', shopName: 'Douala Soaps', location: 'Douala', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [] },
    { id: 'admin-1', name: 'Super Admin', email: 'superadmin@example.com', password: 'password', role: 'superadmin', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [] },
    { id: 'agent-1', name: 'Paul Atanga', email: 'agent1@example.com', password: 'password', role: 'delivery_agent', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, availabilityStatus: 'available', addresses: [], followedStores: [] },
    { id: 'agent-2', name: 'Brenda Biya', email: 'agent2@example.com', password: 'password', role: 'delivery_agent', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, availabilityStatus: 'available', addresses: [], followedStores: [] },
    { id: 'depot-agent-1', name: 'Agent Dépôt', email: 'depot@example.com', password: 'password', role: 'depot_agent', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [] },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = usePersistentState<User | null>('currentUser', null);
  const [allUsers, setAllUsers] = usePersistentState<User[]>('allUsers', initialUsers);

  useEffect(() => {
    // Ensure all users have an addresses array and followedStores array
    setAllUsers(prevUsers => {
        let needsUpdate = false;
        const updatedUsers = prevUsers.map(u => {
            if (!u.addresses || !u.followedStores) {
                needsUpdate = true;
                return { ...u, addresses: u.addresses || [], followedStores: u.followedStores || [] };
            }
            return u;
        });
        return needsUpdate ? updatedUsers : prevUsers;
    });
  }, []);

  useEffect(() => {
    setUser(currentUser => {
      if (!currentUser) {
        return null;
      }
      
      const updatedUserInList = allUsers.find(u => u.id === currentUser.id);

      if (!updatedUserInList) {
        return null;
      }

      if (JSON.stringify(currentUser) !== JSON.stringify(updatedUserInList)) {
        return updatedUserInList;
      }
      
      return currentUser;
    });
  }, [allUsers, setUser]);

  const login = useCallback((email: string, password?: string): User | null => {
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
        if (!password) { 
          alert('Mot de passe requis.');
          return null;
        }
        if (foundUser.password !== password) {
            alert('Mot de passe incorrect.');
            return null;
        }
        setUser(foundUser);
        return foundUser;
    }
    
    if (!email.includes('@')) {
        alert("Email invalide");
        return null;
    }
    if (!password) {
        alert("Veuillez fournir un mot de passe pour créer un compte.");
        return null;
    }
    const name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const newUser: User = { 
      id: new Date().getTime().toString(),
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      email,
      role: 'customer',
      loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
      password: password,
      addresses: [],
      followedStores: [],
    };
    setAllUsers(prev => [...prev, newUser]);
    setUser(newUser);
    return newUser;
  }, [allUsers, setAllUsers, setUser]);

  const register = useCallback((name: string, email: string, password?: string): User | null => {
      const existingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
          alert("Un utilisateur avec cet email existe déjà.");
          return null;
      }
      if (!password || password.length < 6) {
          alert("Le mot de passe est requis et doit contenir au moins 6 caractères.");
          return null;
      }

      const newUser: User = {
          id: new Date().getTime().toString(),
          name,
          email,
          role: 'customer',
          loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
          password: password,
          addresses: [],
          followedStores: [],
      };

      setAllUsers(prev => [...prev, newUser]);
      setUser(newUser);
      return newUser;
  }, [allUsers, setAllUsers, setUser]);

  const updateUser = useCallback((updates: Partial<Omit<User, 'id' | 'email' | 'role' | 'loyalty'>>) => {
    if (!user) return;
    setAllUsers(prevUsers =>
      prevUsers.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            ...updates,
            role: updates.shopName ? ('seller' as const) : u.role,
          };
        }
        return u;
      })
    );
  }, [user, setAllUsers]);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const resetPassword = useCallback((email: string, newPassword: string) => {
    setAllUsers(prevUsers => 
        prevUsers.map(u => 
            u.email.toLowerCase() === email.toLowerCase() ? { ...u, password: newPassword } : u
        )
    );
    console.log(`Password for ${email} reset successfully.`);
  }, [setAllUsers]);

  const updateUserInfo = useCallback((userId: string, updates: { name: string }) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  }, [setAllUsers]);

  const changePassword = useCallback((userId: string, oldPassword: string, newPassword: string): boolean => {
    const userToUpdate = allUsers.find(u => u.id === userId);
    if (!userToUpdate || userToUpdate.password !== oldPassword) {
      return false;
    }
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    return true;
  }, [allUsers, setAllUsers]);

  const addAddress = useCallback((userId: string, address: Omit<Address, 'id'| 'isDefault'>) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const addresses = u.addresses || [];
        const newAddress: Address = {
          ...address,
          id: `addr_${Date.now()}`,
          isDefault: addresses.length === 0, // Make first address default
        };
        return { ...u, addresses: [...addresses, newAddress] };
      }
      return u;
    }));
  }, [setAllUsers]);
  
  const updateAddress = useCallback((userId: string, updatedAddress: Address) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const addresses = (u.addresses || []).map(addr =>
          addr.id === updatedAddress.id ? updatedAddress : addr
        );
        return { ...u, addresses };
      }
      return u;
    }));
  }, [setAllUsers]);

  const deleteAddress = useCallback((userId: string, addressId: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const addresses = (u.addresses || []).filter(addr => addr.id !== addressId);
        // If the deleted address was the default, make the first one default
        if (addresses.length > 0 && !addresses.some(a => a.isDefault)) {
            addresses[0].isDefault = true;
        }
        return { ...u, addresses };
      }
      return u;
    }));
  }, [setAllUsers]);

  const setDefaultAddress = useCallback((userId: string, addressId: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const addresses = (u.addresses || []).map(addr => ({
          ...addr,
          isDefault: addr.id === addressId,
        }));
        return { ...u, addresses };
      }
      return u;
    }));
  }, [setAllUsers]);

  const toggleFollowStore = useCallback((storeId: string) => {
    if (!user) return;
    setAllUsers(prevUsers =>
      prevUsers.map(u => {
        if (u.id === user.id) {
          const followed = u.followedStores || [];
          const isFollowing = followed.includes(storeId);
          return {
            ...u,
            followedStores: isFollowing
              ? followed.filter(id => id !== storeId)
              : [...followed, storeId],
          };
        }
        return u;
      })
    );
  }, [user, setAllUsers]);
  
  const contextValue = useMemo(() => ({
    user,
    allUsers,
    login,
    logout,
    register,
    updateUser,
    resetPassword,
    updateUserInfo,
    changePassword,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    toggleFollowStore,
    setAllUsers
  }), [user, allUsers, login, logout, register, updateUser, resetPassword, updateUserInfo, changePassword, addAddress, updateAddress, deleteAddress, setDefaultAddress, toggleFollowStore, setAllUsers]);

  return (
    <AuthContext.Provider value={contextValue as any}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as AuthContextType & { setAllUsers: React.Dispatch<React.SetStateAction<User[]>> };
};