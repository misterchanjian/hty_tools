"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getSession, type AppUser } from "@/lib/auth";

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
  const [role, setRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      setRole(session.role);
      setUserProfile({ role: session.role, name: session.name });
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role, userProfile }}>
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
