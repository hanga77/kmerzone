import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { User, Address, UserRole } from '../types';

async function makeApiRequest(url: string, method: string = 'GET', body?: any) {
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const token = localStorage.getItem('authToken');
    if (token) {
        (options.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error on ${method} ${url}`);
    }
    return response.json();
}


interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole, phone?: string, birthDate?: string, address?: Omit<Address, 'id' | 'isDefault'>) => Promise<User | null>;
  updateUser: (updates: Partial<User>) => Promise<User | null>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  addAddress: (userId: string, address: Omit<Address, 'id'>) => Promise<User | null>;
  updateAddress: (userId: string, address: Address) => Promise<User | null>;
  deleteAddress: (userId: string, addressId: string) => Promise<User | null>;
  setDefaultAddress: (userId: string, addressId: string) => Promise<User | null>;
  toggleFollowStore: (storeId: string) => void;
  updateAuth: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT - simplified, in real app use a library like jwt-decode
function decodeJwt(token: string): any {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));

   useEffect(() => {
        if (token) {
            try {
                const decodedUser = decodeJwt(token);
                // FIX: Added a check to ensure the decoded token payload is valid before setting the user.
                // This prevents a crash on startup if the token is malformed.
                if (decodedUser && decodedUser.user) {
                    setUser({ ...decodedUser.user });
                } else {
                    console.error("Malformed token payload:", decodedUser);
                    localStorage.removeItem('authToken');
                    setToken(null);
                    setUser(null);
                }
            } catch (e) {
                console.error("Invalid token:", e);
                localStorage.removeItem('authToken');
                setToken(null);
                setUser(null);
            }
        }
   }, [token]);

    const updateAuth = useCallback((newToken: string, newUser: User) => {
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
        setUser(newUser);
    }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    try {
        const { token: newToken, user: loggedInUser } = await makeApiRequest('/api/auth/login', 'POST', { email, password });
        updateAuth(newToken, loggedInUser);
        return loggedInUser;
    } catch (error) {
        console.error(error);
        return null;
    }
  }, [updateAuth]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole, phone?: string, birthDate?: string, address?: Omit<Address, 'id'|'isDefault'>): Promise<User | null> => {
    try {
        const { token: newToken, user: newUser } = await makeApiRequest('/api/auth/register', 'POST', { name, email, password, role, phone, birthDate, address });
        updateAuth(newToken, newUser);
        return newUser;
    } catch (error) {
        console.error(error);
        return null;
    }
  }, [updateAuth]);

  const updateUser = useCallback(async (updates: Partial<User>): Promise<User | null> => {
      if (!user) return null;
      try {
          const { updatedUser, token: newToken } = await makeApiRequest('/api/users/me', 'PATCH', updates);
          updateAuth(newToken, updatedUser);
          return updatedUser;
      } catch (error) {
          console.error("Failed to update user:", error);
          return null;
      }
  }, [user, updateAuth]);

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
      try {
          await makeApiRequest('/api/auth/change-password', 'POST', { oldPassword, newPassword });
          return true;
      } catch (error) {
          console.error("Failed to change password:", error);
          return false;
      }
  };
  
  const resetPassword = async (email: string): Promise<void> => {
      try {
        await makeApiRequest('/api/auth/forgot-password', 'POST', { email });
        console.log(`Password reset link sent to ${email} (simulated).`);
      } catch (error) {
        console.error("Failed to send reset password link:", error);
      }
  };
  
  const addAddress = useCallback(async (userId: string, address: Omit<Address, 'id'>): Promise<User | null> => {
      if (!user) return null;
      try {
          const { updatedUser, token: newToken } = await makeApiRequest('/api/users/me/addresses', 'POST', address);
          updateAuth(newToken, updatedUser);
          return updatedUser;
      } catch(error) {
          console.error("Failed to add address:", error);
          return null;
      }
  }, [user, updateAuth]);

  const updateAddress = useCallback(async (userId: string, address: Address): Promise<User | null> => {
      if (!user || !address.id) return null;
      try {
          const { updatedUser, token: newToken } = await makeApiRequest(`/api/users/me/addresses/${address.id}`, 'PUT', address);
          updateAuth(newToken, updatedUser);
          return updatedUser;
      } catch(error) {
          console.error("Failed to update address:", error);
          return null;
      }
  }, [user, updateAuth]);

  const deleteAddress = useCallback(async (userId: string, addressId: string): Promise<User | null> => {
      if (!user) return null;
      try {
          const { updatedUser, token: newToken } = await makeApiRequest(`/api/users/me/addresses/${addressId}`, 'DELETE');
          updateAuth(newToken, updatedUser);
          return updatedUser;
      } catch(error) {
          console.error("Failed to delete address:", error);
          return null;
      }
  }, [user, updateAuth]);

  const setDefaultAddress = useCallback(async (userId: string, addressId: string): Promise<User | null> => {
      if (!user) return null;
      try {
          const { updatedUser, token: newToken } = await makeApiRequest(`/api/users/me/addresses/${addressId}/default`, 'POST');
          updateAuth(newToken, updatedUser);
          return updatedUser;
      } catch(error) {
          console.error("Failed to set default address:", error);
          return null;
      }
  }, [user, updateAuth]);
  
  const toggleFollowStore = useCallback(async (storeId: string) => {
    if (!user) return;
    try {
        const { updatedUser, token: newToken } = await makeApiRequest(`/api/users/me/toggle-follow/${storeId}`, 'POST');
        updateAuth(newToken, updatedUser);
    } catch (error) {
        console.error("Failed to toggle follow store:", error);
        alert("Action impossible pour le moment. Réessayez plus tard.");
    }
  }, [user, updateAuth]);

  const contextValue = useMemo(() => ({
    user,
    token,
    login,
    logout,
    register,
    updateUser,
    changePassword,
    resetPassword,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    toggleFollowStore,
    updateAuth
  }), [user, token, login, logout, register, updateUser, changePassword, resetPassword, addAddress, updateAddress, deleteAddress, setDefaultAddress, toggleFollowStore, updateAuth]);

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