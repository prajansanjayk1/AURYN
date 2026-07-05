'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string;
  role: 'admin' | 'chef' | 'runner' | 'owner' | 'manager' | 'cashier' | 'cleaner' | 'supervisor';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  syncSession: (supabaseUser: any, forceRole?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  syncSession: async () => false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync session cookie with next.js backend server
  const syncSession = async (supabaseUser: any, forceRole?: string): Promise<boolean> => {
    if (!supabaseUser) return false;

    try {
      // 1. Fetch user profile from Supabase PostgreSQL 'users' table
      const { data: userDoc, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      let name = supabaseUser.user_metadata?.full_name || 'Staff Member';
      let role = forceRole || 'runner'; // default fallback role

      if (userDoc) {
        name = userDoc.name || name;
        role = userDoc.role || role;
      } else {
        // If they don't exist in PostgreSQL (e.g. first time Google login), check if their email matches seed
        const emailLower = supabaseUser.email?.toLowerCase();
        if (emailLower === 'admin@dineflow.ai') {
          role = 'admin';
          name = 'Executive Director';
        } else if (emailLower === 'chef@dineflow.ai') {
          role = 'chef';
          name = 'Chef de Cuisine';
        } else if (emailLower === 'runner@dineflow.ai') {
          role = 'runner';
          name = 'Service Runner';
        }

        // Create user document in public.users to persist their profile
        await supabase.from('users').insert({
          id: supabaseUser.id,
          email: supabaseUser.email,
          name,
          role,
          restaurant_id: 'auryn-hq',
          branch_id: 'main-branch'
        });
      }

      // 2. Call local auth API to set df_session cookie so checkAuth server route guards pass
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: supabaseUser.email,
          password: 'firebase_auth_validated', // Keep compat with server-side API auth validation bypass
          action: 'login'
        })
      });

      if (res.ok) {
        setUser({
          uid: supabaseUser.id,
          email: supabaseUser.email,
          name,
          role: role as any
        });
        return true;
      }
    } catch (e) {
      console.error('[Auth Provider] Sync session error:', e);
    }
    return false;
  };

  useEffect(() => {
    // Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncSession(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, syncSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
