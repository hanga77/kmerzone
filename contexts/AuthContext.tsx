import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { User, UserRole, Address } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  login: (email: string, password?: string) => User | null;
  logout: () => void;
  register: (name: string, email: string, password?: string, accountType?: 'customer' | 'seller') => User | null;
  updateUser: (updates: Partial<Omit<User, 'id' | 'email' | 'role' | 'loyalty'>>) => void;
  resetPassword: (email: string, newPassword: string) => void;
  updateUserInfo: (userId: string, updates: Partial<User>) => void;
  changePassword: (userId: string, oldPassword: string, newPassword: string) => boolean;
  addAddress: (userId: string, address: Omit<Address, 'id' | 'isDefault'>) => void;
  updateAddress: (userId: string, address: Address) => void;
  deleteAddress: (userId: string, addressId: string) => void;
  setDefaultAddress: (userId: string, addressId: string) => void;
  toggleFollowStore: (storeId: string) => void;
  setAllUsers: (updater: React.SetStateAction<User[]>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultNotificationPrefs = { promotions: true, orderUpdates: true, newsletters: true };

const initialUsers: User[] = [
    { id: 'assistant-id', name: 'Assistant KMER ZONE', email: 'assistant@kmerzone.com', password: 'password', role: 'customer', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs },
    { 
        id: 'customer-1', 
        name: 'Client Test', 
        email: 'customer@example.com', 
        password: 'password', 
        role: 'customer', 
        loyalty: { status: 'premium', orderCount: 12, totalSpent: 62000, premiumStatusMethod: 'loyalty' }, 
        addresses: [
            { id: 'addr1', isDefault: true, label: 'Maison', fullName: 'Client Test', phone: '690123456', address: '123 Rue de la Liberté', city: 'Douala', latitude: 4.0483, longitude: 9.7020 }
        ], 
        followedStores: ['store-1'],
        profilePictureUrl: 'https://i.pravatar.cc/150?u=customer-1',
        phone: '690123456',
        birthDate: '1990-05-15',
        gender: 'Homme',
        notificationPreferences: { promotions: true, orderUpdates: true, newsletters: false }
    },
    { id: 'seller-1', name: 'Kmer Fashion', email: 'seller@example.com', password: 'password', role: 'seller', shopName: 'Kmer Fashion', location: 'Douala', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs },
    { id: 'seller-2', name: 'Mama Africa', email: 'mamaafrica@example.com', password: 'password', role: 'seller', shopName: 'Mama Africa', location: 'Yaoundé', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs },
    { id: 'seller-3', name: 'Electro Plus', email: 'electro@example.com', password: 'password', role: 'seller', shopName: 'Electro Plus', location: 'Yaoundé', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs },
    { id: 'seller-4', name: 'Douala Soaps', email: 'soaps@example.com', password: 'password', role: 'seller', shopName: 'Douala Soaps', location: 'Douala', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs },
    { id: 'admin-1', name: 'Super Admin', email: 'superadmin@example.com', password: 'password', role: 'superadmin', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs },
    { id: 'agent-1', name: 'Paul Atanga', email: 'agent1@example.com', password: 'password', role: 'delivery_agent', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, availabilityStatus: 'available', addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs, zoneId: 'zone-dla-a' },
    { id: 'agent-2', name: 'Brenda Biya', email: 'agent2@example.com', password: 'password', role: 'delivery_agent', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, availabilityStatus: 'available', addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs, zoneId: 'zone-yde-a' },
    { id: 'depot-agent-1', name: 'Agent Dépôt Akwa', email: 'depot@example.com', password: 'password', role: 'depot_agent', depotId: 'pp1', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs, zoneId: 'zone-dla-a' },
    { id: 'depot-manager-1', name: 'Chef de Dépôt Akwa', email: 'depot.manager@example.com', password: 'password', role: 'depot_manager', depotId: 'pp1', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, addresses: [], followedStores: [], notificationPreferences: defaultNotificationPrefs, zoneId: 'zone-dla-a' },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loggedInUserId, setLoggedInUserId] = usePersistentState<string | null>('currentUserId', null);
  const [allUsers, setAllUsers] = usePersistentState<User[]>('allUsers', initialUsers);

  const user = useMemo(() => {
    if (!loggedInUserId) return null;
    return allUsers.find(u => u.id === loggedInUserId) ?? null;
  }, [loggedInUserId, allUsers]);

  useEffect(() => {
    // One-time data migration/initialization effect
    setAllUsers(prevUsers => {
        let needsUpdate = false;
        const updatedUsers = prevUsers.map(u => {
            if (!u.addresses || !u.followedStores || !u.notificationPreferences) {
                needsUpdate = true;
                return { 
                    ...u, 
                    addresses: u.addresses || [], 
                    followedStores: u.followedStores || [],
                    notificationPreferences: u.notificationPreferences || defaultNotificationPrefs,
                };
            }
            return u;
        });
        return needsUpdate ? updatedUsers : prevUsers;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setLoggedInUserId(foundUser.id);
        return foundUser;
    }
    
    alert("Aucun compte trouvé avec cet email. Veuillez vous inscrire.");
    return null;
  }, [allUsers, setLoggedInUserId]);

  const register = useCallback((name: string, email: string, password?: string, accountType: 'customer' | 'seller' = 'customer'): User | null => {
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
          role: accountType,
          loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
          password: password,
          addresses: [],
          followedStores: [],
          notificationPreferences: defaultNotificationPrefs,
      };

      setAllUsers(prev => [...prev, newUser]);
      setLoggedInUserId(newUser.id);
      return newUser;
  }, [allUsers, setAllUsers, setLoggedInUserId]);

  const updateUser = useCallback((updates: Partial<Omit<User, 'id' | 'email' | 'role' | 'loyalty'>>) => {
    if (!loggedInUserId) return;
    setAllUsers(prevUsers =>
      prevUsers.map(u => {
        if (u.id === loggedInUserId) {
          return {
            ...u,
            ...updates,
            role: updates.shopName ? ('seller' as const) : u.role,
          };
        }
        return u;
      })
    );
  }, [loggedInUserId, setAllUsers]);

  const logout = useCallback(() => {
    setLoggedInUserId(null);
  }, [setLoggedInUserId]);

  const resetPassword = useCallback((email: string, newPassword: string) => {
    setAllUsers(prevUsers => 
        prevUsers.map(u => 
            u.email.toLowerCase() === email.toLowerCase() ? { ...u, password: newPassword } : u
        )
    );
    console.log(`Password for ${email} reset successfully.`);
  }, [setAllUsers]);

  const updateUserInfo = useCallback((userId: string, updates: Partial<User>) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  }, [setAllUsers]);

  const changePassword = useCallback((userId: string, oldPassword: string, newPassword: string): boolean => {
    let success = false;
    setAllUsers(prev => {
        const userToUpdate = prev.find(u => u.id === userId);
        if (!userToUpdate || userToUpdate.password !== oldPassword) {
            success = false;
            return prev;
        }
        success = true;
        return prev.map(u => u.id === userId ? { ...u, password: newPassword } : u);
    });
    return success;
  }, [setAllUsers]);

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
    if (!loggedInUserId) return;
    setAllUsers(prevUsers =>
      prevUsers.map(u => {
        if (u.id === loggedInUserId) {
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
  }, [loggedInUserId, setAllUsers]);
  
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
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};