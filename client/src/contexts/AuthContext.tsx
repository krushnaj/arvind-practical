import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  demoLogin: (username: string) => Promise<void>;
  logout: () => void;
  setUserPlant: (plant: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SUPERVISOR: User = {
  id: 'usr_001',
  username: 'supervisor',
  name: 'Shop-Floor Supervisor',
  role: 'supervisor',
  plant: 'Plant Floor',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check localStorage on mount
    const savedToken = localStorage.getItem('arvind_auth_token');
    const savedUser = localStorage.getItem('arvind_auth_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        // Fallback default
        setUser(DEFAULT_SUPERVISOR);
      }
    } else {
      // Auto-set default shopfloor supervisor for friction-free inspection logging
      setUser(DEFAULT_SUPERVISOR);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(username, password);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('arvind_auth_token', res.token);
      localStorage.setItem('arvind_auth_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (username: string) => {
    setIsLoading(true);
    try {
      // Password for all seeded users is arvind123
      const res = await api.login(username, 'arvind123');
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('arvind_auth_token', res.token);
      localStorage.setItem('arvind_auth_user', JSON.stringify(res.user));
    } catch {
      // Offline demo fallback
      let fallbackUser = DEFAULT_SUPERVISOR;
      if (username === 'manager') {
        fallbackUser = {
          id: 'usr_002',
          username: 'manager',
          name: 'Quality Manager',
          role: 'manager',
          plant: 'Plant Floor',
        };
      } else if (username === 'admin') {
        fallbackUser = {
          id: 'usr_003',
          username: 'admin',
          name: 'Plant Admin',
          role: 'admin',
          plant: 'Plant Floor',
        };
      }
      setUser(fallbackUser);
      localStorage.setItem('arvind_auth_user', JSON.stringify(fallbackUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('arvind_auth_token');
    localStorage.removeItem('arvind_auth_user');
  };

  const setUserPlant = (plant: string) => {
    if (user) {
      const updated = { ...user, plant };
      setUser(updated);
      localStorage.setItem('arvind_auth_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        demoLogin,
        logout,
        setUserPlant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
