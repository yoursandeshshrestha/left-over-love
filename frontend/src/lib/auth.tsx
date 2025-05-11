"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "./api";
import { User } from "./types";
import Cookies from "js-cookie";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      authAPI
        .getCurrentUser()
        .then((response) => {
          if (response.data?.data) {
            setUser(response.data.data);
          }
        })
        .catch(() => {
          Cookies.remove("token");
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(email, password);
      if (response.success && response.token && response.data) {
        Cookies.set("token", response.token);
        setUser(response.data);
        router.push(`/${response.data.role}/dashboard`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError("Invalid email or password");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.register(userData);
      if (response.success && response.token && response.data) {
        Cookies.set("token", response.token);
        setUser(response.data);
        router.push(`/${response.data.role}/dashboard`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
    router.push("/auth/login");
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.updateProfile(userData);
      if (response.data?.data) {
        setUser(response.data.data);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError("Failed to update profile");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
