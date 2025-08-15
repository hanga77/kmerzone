import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  register: (name: string, email: string) => boolean;
  updateUser: (updates: Partial<Omit<User, 'id' | 'email' | 'role' | 'loyalty'>>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialUsers: User[] = [
    { id: 'assistant-id', name: 'Assistant KMER ZONE', email: 'assistant@kmerzone.com', role: 'customer', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'seller-1', name: 'Kmer Fashion', email: 'seller@example.com', role: 'seller', shopName: 'Kmer Fashion', location: 'Douala', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'seller-2', name: 'Mama Africa', email: 'mamaafrica@example.com', role: 'seller', shopName: 'Mama Africa', location: 'Yaoundé', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'seller-3', name: 'Electro Plus', email: 'electro@example.com', role: 'seller', shopName: 'Electro Plus', location: 'Yaoundé', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'seller-4', name: 'Douala Soaps', email: 'soaps@example.com', role: 'seller', shopName: 'Douala Soaps', location: 'Douala', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'admin-1', name: 'Super Admin', email: 'superadmin@example.com', role: 'superadmin', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'agent-1', name: 'Paul Atanga', email: 'agent1@example.com', role: 'delivery_agent', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
    { id: 'agent-2', name: 'Brenda Biya', email: 'agent2@example.com', role: 'delivery_agent', loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null } },
];

const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue);
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = usePersistentState<User | null>('currentUser', null);
  const [allUsers, setAllUsers] = usePersistentState<User[]>('allUsers', initialUsers);

  // Effect to keep the `user` state in sync with the `allUsers` array.
  // This ensures that if loyalty status or other details are updated elsewhere,
  // the currently logged-in user's session reflects those changes immediately.
  useEffect(() => {
    if (user) {
      const updatedUserInList = allUsers.find(u => u.id === user.id);
      // A simple string comparison is sufficient here to prevent infinite loops.
      // It detects if the user object in the main list has changed.
      if (updatedUserInList && JSON.stringify(user) !== JSON.stringify(updatedUserInList)) {
        setUser(updatedUserInList);
      }
    }
  }, [allUsers, user, setUser]);

  const login = useCallback((email: string, password?: string): boolean => {
    // This is a simplified login.
    // For demo, any password is fine for existing accounts, but a password is required.
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
        if (!password) { 
          alert('Mot de passe requis.');
          return false;
        }
        setUser(foundUser);
        return true;
    }
    
    // For demo purposes, create a customer if not found
    if (!email.includes('@')) {
        alert("Email invalide");
        return false;
    }
    const name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const newUser: User = { 
      id: new Date().getTime().toString(),
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      email,
      role: 'customer',
      loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
    };
    setAllUsers(prev => [...prev, newUser]);
    setUser(newUser);
    return true;
  }, [allUsers, setAllUsers, setUser]);

  const register = useCallback((name: string, email: string): boolean => {
      const existingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
          alert("Un utilisateur avec cet email existe déjà.");
          return false;
      }

      const newUser: User = {
          id: new Date().getTime().toString(),
          name,
          email,
          role: 'customer',
          loyalty: { status: 'standard', orderCount: 0, totalSpent: 0, premiumStatusMethod: null },
      };

      setAllUsers(prev => [...prev, newUser]);
      setUser(newUser);
      return true;
  }, [allUsers, setAllUsers, setUser]);

  const updateUser = useCallback((updates: Partial<Omit<User, 'id' | 'email' | 'role' | 'loyalty'>>) => {
    setUser(currentUser => {
        if (!currentUser) return null;
        
        const updatedUser = { 
            ...currentUser, 
            ...updates, 
            // If shopName is being set, user becomes a seller
            role: updates.shopName ? 'seller' as const : currentUser.role 
        };
        
        setAllUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedUser : u));

        return updatedUser;
    });
  }, [setAllUsers, setUser]);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);
  
  const contextValue = useMemo(() => ({
    user,
    allUsers,
    login,
    logout,
    register,
    updateUser,
    setAllUsers // Expose this for the loyalty program logic in App.tsx
  }), [user, allUsers, login, logout, register, updateUser, setAllUsers]);

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
  return context as AuthContextType & { setAllUsers: React.Dispatch<React.SetStateAction<User[]>> }; // Cast for the loyalty program
};