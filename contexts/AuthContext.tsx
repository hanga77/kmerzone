import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { User, Address } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';
import { apiFetch } from '../utils/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<User | null>;
  logout: () => void;
  register: (name: string, email: string, password?: string) => Promise<User | null>;
  updateUser: (updates: Partial<Omit<User, 'id' | 'email' | 'role'>>) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  updateUserInfo: (userId: string, updates: { name: string }) => Promise<void>;
  changePassword: (userId: string, oldPassword: string, newPassword: string) => Promise<boolean>;
  addAddress: (userId: string, address: Omit<Address, 'id' | 'isDefault'>) => Promise<void>;
  updateAddress: (userId: string, address: Address) => Promise<void>;
  deleteAddress: (userId: string, addressId: string) => Promise<void>;
  setDefaultAddress: (userId: string, addressId: string) => Promise<void>;
  toggleFollowStore: (storeId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = usePersistentState<User | null>('currentUser', null);

  useEffect(() => {
    const autoLogin = async () => {
      const token = localStorage.getItem('token');
      if (token && !user) {
        try {
          const userData = await apiFetch('/auth/me');
          setUser(userData);
        } catch (error) {
          console.error('Auto-login failed:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
    };
    autoLogin();
  }, [setUser, user]);

  const login = useCallback(async (email: string, password?: string): Promise<User | null> => {
    if (!password) {
      alert('Mot de passe requis.');
      return null;
    }
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', data.token);
      const { token, ...userData } = data;
      setUser(userData);
      return userData;
    } catch (error: any) {
      alert(`Erreur de connexion: ${error.message}`);
      return null;
    }
  }, [setUser]);

  const register = useCallback(async (name: string, email: string, password?: string): Promise<User | null> => {
     if (!password || password.length < 6) {
          alert("Le mot de passe est requis et doit contenir au moins 6 caractères.");
          return null;
      }
     try {
        const data = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        localStorage.setItem('token', data.token);
        const { token, ...userData } = data;
        setUser(userData);
        return userData;
     } catch (error: any) {
        alert(`Erreur d'inscription: ${error.message}`);
        return null;
     }
  }, [setUser]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
  }, [setUser]);

  const updateUser = useCallback(async (updates: Partial<Omit<User, 'id' | 'email' | 'role'>>) => {
    if (!user) return;
    try {
        const updatedUserFromServer = await apiFetch('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        setUser(prev => prev ? { ...prev, ...updates, ...updatedUserFromServer } : null);
    } catch (error) {
        console.error('Failed to update user on backend:', error);
        alert("La mise à jour du profil a échoué.");
    }
  }, [user, setUser]);

  const resetPassword = useCallback(async (email: string, newPassword: string) => {
    // This is a simulation since backend doesn't have a reset token flow
    console.log(`Password for ${email} reset to ${newPassword} (simulation).`);
  }, []);

  const updateUserInfo = useCallback(async (userId: string, updates: { name: string }) => {
     try {
        const updatedUser = await apiFetch('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        setUser(prev => prev ? { ...prev, ...updatedUser } : null);
    } catch (error) {
        console.error('Failed to update user info', error);
    }
  }, [setUser]);

  const changePassword = useCallback(async (userId: string, oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
        await apiFetch('/users/profile/password', {
            method: 'PUT',
            body: JSON.stringify({ oldPassword, newPassword }),
        });
        return true;
    } catch (error) {
        console.error('Failed to change password', error);
        return false;
    }
  }, []);

  const addAddress = useCallback(async (userId: string, address: Omit<Address, 'id' | 'isDefault'>) => {
    try {
        const updatedAddresses = await apiFetch('/users/addresses', {
            method: 'POST',
            body: JSON.stringify(address),
        });
        setUser(prev => prev ? { ...prev, addresses: updatedAddresses } : null);
    } catch (error) { console.error('Failed to add address', error); }
  }, [setUser]);
  
  const updateAddress = useCallback(async (userId: string, updatedAddress: Address) => {
    try {
        const updatedAddresses = await apiFetch(`/users/addresses/${updatedAddress.id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedAddress),
        });
        setUser(prev => prev ? { ...prev, addresses: updatedAddresses } : null);
    } catch (error) { console.error('Failed to update address', error); }
  }, [setUser]);

  const deleteAddress = useCallback(async (userId: string, addressId: string) => {
    try {
        const updatedAddresses = await apiFetch(`/users/addresses/${addressId}`, { method: 'DELETE' });
        setUser(prev => prev ? { ...prev, addresses: updatedAddresses } : null);
    } catch (error) { console.error('Failed to delete address', error); }
  }, [setUser]);

  const setDefaultAddress = useCallback(async (userId: string, addressId: string) => {
     try {
        const updatedAddresses = await apiFetch(`/users/addresses/${addressId}/default`, { method: 'PUT' });
        setUser(prev => prev ? { ...prev, addresses: updatedAddresses } : null);
    } catch (error) { console.error('Failed to set default address', error); }
  }, [setUser]);

  const toggleFollowStore = useCallback(async (storeId: string) => {
    if (!user) return;
    try {
        const updatedFollowedStores = await apiFetch(`/users/followed-stores/${storeId}`, { method: 'POST' });
        setUser(prev => prev ? { ...prev, followedStores: updatedFollowedStores } : null);
    } catch (error) { console.error('Failed to toggle follow store', error); }
  }, [user, setUser]);
  
  const contextValue = useMemo(() => ({
    user,
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
  }), [user, login, logout, register, updateUser, resetPassword, updateUserInfo, changePassword, addAddress, updateAddress, deleteAddress, setDefaultAddress, toggleFollowStore]);

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
  return context as AuthContextType;
};