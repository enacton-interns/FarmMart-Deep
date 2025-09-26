'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: {
    email: string;
    password: string;
    name: string;
    role?: 'customer' | 'farmer' | 'admin';
    address?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        // Convert date strings to Date objects
        const user = {
          ...userData.user,
          createdAt: new Date(userData.user.createdAt),
          updatedAt: new Date(userData.user.updatedAt),
        };
        setUser(user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store basic user data initially
        setUser(data.user);
        // Fetch complete user data from database
        await fetchUserData();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signup = async (userData: {
    email: string;
    password: string;
    name: string;
    role?: 'customer' | 'farmer' | 'admin';
    address?: string;
    phone?: string;
  }) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store basic user data initially
        setUser(data.user);
        // Fetch complete user data from database
        await fetchUserData();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const refreshUser = async () => {
    fetchUserData();
  };

  const logout = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch((error) => {
      console.error('Logout error:', error);
    }).finally(() => {
      setUser(null);
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
