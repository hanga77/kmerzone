import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  register: (name: string, email: string, password?: string) => boolean;
  updateUser: (updates: Partial<Omit<User, 'id' | 'email' | 'role' | 'loyalty'>>) => void;
  resetPassword: (email: string, newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialUsers: User[] = [
    { id: 'assistant-id', name: 'Assistant KMER ZONE', email: 'assistant@kmerzone.com', password: 'password', role: 'customer', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'seller-1', name: 'Kmer Fashion', email: 'seller@example.com', password: 'password', role: 'seller', shopName: 'Kmer Fashion', location: 'Douala', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'seller-2', name: 'Mama Africa', email: 'mamaafrica@example.com', password: 'password', role: 'seller', shopName: 'Mama Africa', location: 'Yaoundé', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'seller-3', name: 'Electro Plus', email: 'electro@example.com', password: 'password', role: 'seller', shopName: 'Electro Plus', location: 'Yaoundé', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'seller-4', name: 'Douala Soaps', email: 'soaps@example.com', password: 'password', role: 'seller', shopName: 'Douala Soaps', location: 'Douala', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'admin-1', name: 'Super Admin', email: 'superadmin@example.com', password: 'password', role: 'superadmin', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'agent-1', name: 'Paul Atanga', email: 'agent1@example.com', password: 'password', role: 'delivery_agent', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, availabilityStatus: 'available' },
    { id: 'agent-2', name: 'Brenda Biya', email: 'agent2@example.com', password: 'password', role: 'delivery_agent', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null }, availabilityStatus: 'available' },
    { id: 'depot-agent-1', name: 'Agent Dépôt', email: 'depot@example.com', password: 'password', role: 'depot_agent', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = usePersistentState<User | null>('currentUser', null);
  const [allUsers, setAllUsers] = usePersistentState<User[]>('allUsers', initialUsers);

  useEffect(() => {
    setUser(currentUser => {
      if (!currentUser) {
        return null;
      }
      
      const updatedUserInList = allUsers.find(u => u.id === currentUser.id);

      if (!updatedUserInList) {
        return null;
      }

      const isDifferent =
        currentUser.name !== updatedUserInList.name ||
        currentUser.email !== updatedUserInList.email ||
        currentUser.role !== updatedUserInList.role ||
        currentUser.shopName !== updatedUserInList.shopName ||
        JSON.stringify(currentUser.loyalty) !== JSON.stringify(updatedUserInList.loyalty);

      if (isDifferent) {
        return updatedUserInList;
      }
      
      return currentUser;
    });
  }, [allUsers, setUser]);

  const login = useCallback((email: string, password?: string): boolean => {
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
        if (!password) { 
          alert('Mot de passe requis.');
          return false;
        }
        if (foundUser.password !== password) {
            alert('Mot de passe incorrect.');
            return false;
        }
        setUser(foundUser);
        return true;
    }
    
    if (!email.includes('@')) {
        alert("Email invalide");
        return false;
    }
    if (!password) {
        alert("Veuillez fournir un mot de passe pour créer un compte.");
        return false;
    }
    const name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const newUser: User = { 
      id: new Date().getTime().toString(),
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      email,
      role: 'customer',
      loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
      password: password,
    };
    setAllUsers(prev => [...prev, newUser]);
    setUser(newUser);
    return true;
  }, [allUsers, setAllUsers, setUser]);

  const register = useCallback((name: string, email: string, password?: string): boolean => {
      const existingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
          alert("Un utilisateur avec cet email existe déjà.");
          return false;
      }
      if (!password || password.length < 6) {
          alert("Le mot de passe est requis et doit contenir au moins 6 caractères.");
          return false;
      }

      const newUser: User = {
          id: new Date().getTime().toString(),
          name,
          email,
          role: 'customer',
          loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
          password: password,
      };

      setAllUsers(prev => [...prev, newUser]);
      setUser(newUser);
      return true;
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
  
  const contextValue = useMemo(() => ({
    user,
    allUsers,
    login,
    logout,
    register,
    updateUser,
    resetPassword,
    setAllUsers
  }), [user, allUsers, login, logout, register, updateUser, resetPassword, setAllUsers]);

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