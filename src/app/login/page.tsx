'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Key, Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/shared/lib/AuthContext';
import { playUISound } from '@/shared/lib/sounds';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const { syncSession, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (errorParam === 'session_expired') {
      setError('Your staff session has expired. Please log in again.');
    } else if (errorParam === 'unauthorized') {
      setError('Access denied: Your account lacks permissions for that workspace.');
    }
  }, [errorParam]);

  // If user is already logged in, redirect them to their workspace
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'owner' || user.role === 'manager') {
        router.push('/admin');
      } else if (user.role === 'chef') {
        router.push('/kitchen');
      } else {
        router.push('/runner');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError('');
    setLoading(true);
    playUISound('click');

    try {
      let supabaseSession = null;
      const isSimulationAccount = 
        (email === 'admin@dineflow.ai' && password === 'admin123') ||
        (email === 'chef@dineflow.ai' && password === 'chef123') ||
        (email === 'runner@dineflow.ai' && password === 'runner123');

      if (isSimulationAccount) {
        // Try to register first if they don't exist
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
          if (!signUpError && signUpData.user) {
            console.log('[AURYN Auth] Registering simulator account in Supabase...');
            supabaseSession = signUpData;
          }
        } catch (err) {
          console.log('[AURYN Auth] Sign up failed or user exists, falling back to sign in...');
        }
      }

      if (!supabaseSession) {
        // Fall back to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        supabaseSession = signInData;
      }

      if (supabaseSession && supabaseSession.user) {
        let targetRole = 'runner';
        if (email.includes('admin')) targetRole = 'admin';
        else if (email.includes('chef')) targetRole = 'chef';

        const success = await syncSession(supabaseSession.user, targetRole);
        if (success) {
          playUISound('success');
          if (targetRole === 'admin') router.push('/admin');
          else if (targetRole === 'chef') router.push('/kitchen');
          else router.push('/runner');
        } else {
          setError('Failed to establish local workspace session. Please retry.');
        }
      } else if (supabaseSession && !supabaseSession.session) {
        // Account created but email confirmation is active in Supabase project settings
        setError('Simulator account created! However, email confirmation is active in your Supabase project. Please log in to your Supabase Dashboard, go to Authentication -> Providers -> Email, and toggle off "Confirm email" to enable instant password logins.');
      }
    } catch (e: any) {
      console.error(e);
      playUISound('error');
      setError(e.message || 'Authorization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    playUISound('click');
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`
        }
      });
      if (error) throw error;
    } catch (e: any) {
      console.error(e);
      playUISound('error');
      setError(e.message || 'Google authorization failed.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center p-6 selection:bg-neutral-800 text-white">
      
      {/* Dynamic Ambient Background Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[20%] left-[30%] w-72 h-72 rounded-full bg-amber-500/20 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[30%] w-96 h-96 rounded-full bg-neutral-500/10 blur-[150px]" />
      </div>

      {/* Brand Icon */}
      <div className="mb-8 flex flex-col items-center z-10">
        <div className="w-14 h-14 bg-neutral-900 border border-neutral-800/80 rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.8)] backdrop-blur-md">
          <Sparkles className="w-6 h-6 text-amber-400" />
        </div>
        <h2 className="text-[14px] font-bold text-neutral-400 uppercase tracking-[0.3em] mt-5">AURYN</h2>
        <span className="text-[9px] font-medium text-amber-500/80 uppercase tracking-widest mt-1">Hospitality Intelligence</span>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm bg-neutral-900/50 border border-neutral-800/80 p-8 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl z-10"
      >
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-white">Staff Portal Sign In</h1>
          <p className="text-[12px] text-neutral-400 font-light mt-1.5">Access secure workspaces and command channels.</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-950/40 border border-rose-900/50 rounded-xl flex gap-2.5 items-start text-[12px] text-rose-400 leading-normal font-light">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5 pl-0.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="email@dineflow.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-800 bg-neutral-950/60 text-[13px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5 pl-0.5">Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-800 bg-neutral-950/60 text-[13px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-neutral-100 text-black rounded-xl text-[12px] font-semibold uppercase tracking-wider transition-colors shadow-luxury flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            <Key className="w-3.5 h-3.5" />
            {loading ? 'Authorizing...' : 'Authorize Access'}
          </motion.button>
        </form>

        {/* Continue with Google button */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <span className="relative bg-[#0A0A0A] px-3.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">or</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white rounded-xl text-[12px] font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-neutral-900 disabled:text-neutral-600"
        >
          <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.47 1.617l2.427-2.427C17.265 1.573 14.938 1 12.24 1c-5.96 0-10.8 4.84-10.8 10.8s4.84 10.8 10.8 10.8c6.22 0 11.24-4.8 11.24-10.8 0-.765-.08-1.513-.23-2.228H12.24z"/>
          </svg>
          Continue with Google
        </motion.button>

        {/* Credentials guide */}
        <div className="mt-8 pt-5 border-t border-neutral-800/80 space-y-2">
          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block">Simulator Credentials</span>
          <div className="grid grid-cols-1 gap-1 text-[11px] text-neutral-400 font-light font-mono">
            <div className="flex justify-between">
              <span>Admin: admin@dineflow.ai</span>
              <span className="font-semibold text-amber-500">admin123</span>
            </div>
            <div className="flex justify-between">
              <span>Chef: chef@dineflow.ai</span>
              <span className="font-semibold text-amber-500">chef123</span>
            </div>
            <div className="flex justify-between">
              <span>Runner: runner@dineflow.ai</span>
              <span className="font-semibold text-amber-500">runner123</span>
            </div>
          </div>
        </div>

      </motion.div>
    </main>
  );
}

export default function StaffLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center p-6 text-center text-white">
        <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center shadow-luxury mb-4">
          <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
