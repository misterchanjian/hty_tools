"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChange, type AppUser } from "@/lib/auth";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  role: string | null;
  userProfile: Record<string, unknown> | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChange((fbUser) => {
      setUser(fbUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role: user?.role ?? null,
        userProfile: user ? { role: user.role, name: user.name } : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return { user: null, loading: false, role: null, userProfile: null };
  }
  return context;
}
