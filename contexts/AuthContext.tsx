import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { User, Address, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole, phone?: string, birthDate?: string, address?: Omit<Address, 'id' | 'isDefault'>) => Promise<User | null>;
  updateUser: (updates: Partial<User>) => Promise<User | null>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  // These address functions are now stubs and should be moved to a dedicated User context or handled differently
  addAddress: (userId: string, address: Omit<Address, 'id'>) => void;
  updateAddress: (userId: string, address: Address) => void;
  deleteAddress: (userId: string, addressId: string) => void;
  setDefaultAddress: (userId: string, addressId: string) => void;
  toggleFollowStore: (storeId: string) => void;
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

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            throw new Error('Login failed');
        }
        const { token, user: loggedInUser } = await response.json();
        localStorage.setItem('authToken', token);
        setToken(token);
        setUser(loggedInUser);
        return loggedInUser;
    } catch (error) {
        console.error(error);
        return null;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole, phone?: string, birthDate?: string, address?: Omit<Address, 'id'|'isDefault'>): Promise<User | null> => {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role, phone, birthDate, address }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }
        const { token, user: newUser } = await response.json();
        localStorage.setItem('authToken', token);
        setToken(token);
        setUser(newUser);
        return newUser;
    } catch (error) {
        console.error(error);
        return null;
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>): Promise<User | null> => {
      if (!user) return null;
      // In a real app, this would be a PUT/PATCH request to '/api/users/me' or similar
      console.log("Simulating user update with:", updates);
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      return updatedUser;
  }, [user]);

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
      console.log("Simulating password change.");
      return true; // Placeholder
  };
  
  const resetPassword = async (email: string): Promise<void> => {
      console.log(`Simulating password reset for ${email}.`);
  };

  const contextValue = useMemo(() => ({
    user,
    token,
    login,
    logout,
    register,
    updateUser,
    changePassword,
    resetPassword,
    // Placeholder functions - these should be moved or implemented with API calls
    addAddress: () => {},
    updateAddress: () => {},
    deleteAddress: () => {},
    setDefaultAddress: () => {},
    toggleFollowStore: () => {},
  }), [user, token, login, logout, register, updateUser]);

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