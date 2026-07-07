'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Clock, ShoppingBag, ShieldCheck, LogIn, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/shared/lib/supabase';

export default function RestaurantLanding() {
  const router = useRouter();
  const [orderMode, setOrderMode] = useState<'dine-in' | 'takeaway'>('dine-in');
  
  // Dine-in states
  const [selectedTable, setSelectedTable] = useState('1');
  const [dineInName, setDineInName] = useState('');
  const [dineInError, setDineInError] = useState('');
  const [verifyingDineIn, setVerifyingDineIn] = useState(false);

  // Takeaway states
  const [takeawayName, setTakeawayName] = useState('');
  const [takeawayType, setTakeawayType] = useState<'pickup' | 'delivery'>('pickup');
  const [pickupTime, setPickupTime] = useState('15:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [takeawayError, setTakeawayError] = useState('');
  const [verifyingTakeaway, setVerifyingTakeaway] = useState(false);

  // Staff Portal popup
  const [showStaffGateway, setShowStaffGateway] = useState(false);

  const handleDineInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dineInName.trim()) return;

    setVerifyingDineIn(true);
    setDineInError('');

    try {
      const guestId = `guest-${Date.now()}`;
      const name = dineInName.trim();

      // Call session join API
      const res = await fetch('/api/session/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: selectedTable, guestId, guestName: name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to initialize session');
      }

      // Store credentials locally
      localStorage.setItem('df_guest_name', name);
      localStorage.setItem('df_guest_id', guestId);
      localStorage.setItem('df_simulated_gps', 'true'); // Simulate geofence validation success

      // Navigate to table dining dashboard
      router.push(`/table/${selectedTable}`);
    } catch (err: any) {
      setDineInError(err.message || 'Verification failed. Try again.');
    } finally {
      setVerifyingDineIn(false);
    }
  };

  const handleTakeawaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!takeawayName.trim()) return;
    if (takeawayType === 'delivery' && !deliveryAddress.trim()) {
      setTakeawayError('Please enter a delivery address.');
      return;
    }

    setVerifyingTakeaway(true);
    setTakeawayError('');

    try {
      const guestId = `guest-${Date.now()}`;
      const name = takeawayName.trim();

      // Call session join API for Takeaway bypass
      const res = await fetch('/api/session/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: 'Takeaway', guestId, guestName: name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to initialize takeaway');
      }

      // Store credentials locally
      localStorage.setItem('df_guest_name', name);
      localStorage.setItem('df_guest_id', guestId);
      localStorage.setItem('df_takeaway_mode', 'true');
      localStorage.setItem('df_takeaway_type', takeawayType);
      localStorage.setItem('df_takeaway_detail', takeawayType === 'pickup' ? pickupTime : deliveryAddress);

      // Navigate to Takeaway dining dashboard (bypasses GPS range checks)
      router.push('/table/Takeaway');
    } catch (err: any) {
      setTakeawayError(err.message || 'Takeaway setup failed. Try again.');
    } finally {
      setVerifyingTakeaway(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#000] text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans selection:bg-neutral-800">
      {/* Immersive background glows (The High Joint Style) */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] rounded-full bg-amber-600/5 blur-[150px] pointer-events-none" />

      {/* Top Header Section */}
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[14px] font-bold uppercase tracking-[0.25em] text-white block">AURYN</span>
            <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest block mt-0.5">Hospitality OS v2.0</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowStaffGateway(!showStaffGateway)}
            className="text-[11px] font-bold text-neutral-400 hover:text-white uppercase tracking-wider transition-colors animate-pulse"
          >
            Staff Portal Access
          </button>
        </div>
      </div>

      {/* Hero & Form Section */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto py-12 z-10">
        
        {/* Left Column: Visual Sizzle */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <span className="px-3.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
            Gourmet Craft Culinary
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase leading-[0.95]">
            Stacked to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Perfection</span>
          </h1>
          <p className="text-[13px] md:text-[14px] text-neutral-400 max-w-md font-light leading-relaxed">
            Welcome to the future of gourmet dining. Scan your table QR code for instant dine-in service, or select takeaway for contact-free pickup and local delivery.
          </p>

          {/* Quick Info Badges */}
          <div className="grid grid-cols-2 gap-4 max-w-sm pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Clock className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block">Preparation</span>
                <span className="text-[12px] font-bold text-white block">12 Mins Avg</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <MapPin className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block">Gps Geofencing</span>
                <span className="text-[12px] font-bold text-white block">Secure Dining</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Form Container */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-neutral-900/50 border border-neutral-800/80 rounded-[32px] p-8 shadow-2xl backdrop-blur-2xl">
            
            {/* Mode Switcher */}
            <div className="flex bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800/60 mb-8">
              <button
                onClick={() => setOrderMode('dine-in')}
                className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                  orderMode === 'dine-in' 
                    ? 'bg-amber-500 text-black font-extrabold shadow-lg' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Dine-In (QR)
              </button>
              <button
                onClick={() => setOrderMode('takeaway')}
                className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                  orderMode === 'takeaway' 
                    ? 'bg-amber-500 text-black font-extrabold shadow-lg' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Takeaway / Delivery
              </button>
            </div>

            <AnimatePresence mode="wait">
              {orderMode === 'dine-in' ? (
                <motion.form
                  key="dine-in"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleDineInSubmit}
                  className="space-y-5 text-left"
                >
                  <h3 className="text-md font-bold text-white uppercase tracking-wider">Initialize Table Node</h3>
                  
                  {dineInError && (
                    <div className="text-[11px] text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl">
                      {dineInError}
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-2">Guest Nickname</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={dineInName}
                      onChange={(e) => setDineInName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-800 bg-neutral-950/70 text-[13px] text-white placeholder:text-neutral-650 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-2">Select Your Table Number</label>
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-800 bg-neutral-950/70 text-[13px] text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                    >
                      {Array.from({ length: 8 }, (_, i) => (
                        <option key={i+1} value={`${i+1}`} className="bg-neutral-950 text-white">Table {i+1} (Simulation QR)</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={verifyingDineIn}
                    className="w-full py-4 bg-white hover:bg-neutral-100 disabled:bg-neutral-800 text-black disabled:text-neutral-500 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-colors mt-2"
                  >
                    {verifyingDineIn ? 'Verifying Node...' : 'Scan QR & Join Table'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="takeaway"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleTakeawaySubmit}
                  className="space-y-5 text-left"
                >
                  <h3 className="text-md font-bold text-white uppercase tracking-wider">Configure Takeaway</h3>
                  
                  {takeawayError && (
                    <div className="text-[11px] text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl">
                      {takeawayError}
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-2">Guest Nickname</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      value={takeawayName}
                      onChange={(e) => setTakeawayName(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border border-neutral-800 bg-neutral-950/70 text-[13px] text-white placeholder:text-neutral-650 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* Takeaway Type Toggle */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setTakeawayType('pickup')}
                      className={`py-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        takeawayType === 'pickup' 
                          ? 'bg-neutral-800 border-neutral-700 text-white' 
                          : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      Pickup
                    </button>
                    <button
                      type="button"
                      onClick={() => setTakeawayType('delivery')}
                      className={`py-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        takeawayType === 'delivery' 
                          ? 'bg-neutral-800 border-neutral-700 text-white' 
                          : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Delivery
                    </button>
                  </div>

                  {takeawayType === 'pickup' ? (
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-2">Scheduled Pickup Time</label>
                      <input
                        type="time"
                        required
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border border-neutral-800 bg-neutral-950/70 text-[13px] text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-2">Delivery Destination Address</label>
                      <input
                        type="text"
                        required
                        placeholder="Flat, building name, local area..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-xl border border-neutral-800 bg-neutral-950/70 text-[13px] text-white placeholder:text-neutral-650 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={verifyingTakeaway}
                    className="w-full py-4 bg-white hover:bg-neutral-100 disabled:bg-neutral-800 text-black disabled:text-neutral-500 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-colors mt-2"
                  >
                    {verifyingTakeaway ? 'Initializing...' : 'Start Takeaway Order'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>

      {/* Staff Gateway overlay */}
      <AnimatePresence>
        {showStaffGateway && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#000]/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <div className="bg-neutral-900 border border-neutral-800 rounded-[28px] p-8 max-w-md w-full relative">
              <button 
                onClick={() => setShowStaffGateway(false)}
                className="absolute top-5 right-5 text-neutral-500 hover:text-white"
              >
                ✕
              </button>
              <h3 className="text-md font-bold text-white uppercase tracking-wider mb-2">Executive Access Gate</h3>
              <p className="text-[12px] text-neutral-400 font-light mb-6">Select the workspace module to synchronize. Authentication tokens will be verified.</p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: 'Kitchen Hot Deck', desc: 'Touch cooking monitor', href: '/kitchen', bg: 'hover:border-indigo-500' },
                  { title: 'Runner Dispatch', desc: 'Cash checkout & routing', href: '/runner', bg: 'hover:border-purple-500' },
                  { title: 'Mission Control', desc: 'Twin & menu settings', href: '/admin', bg: 'hover:border-emerald-500' },
                  { title: 'Staff Sign In', desc: 'Secure credential login', href: '/login', bg: 'hover:border-amber-500' }
                ].map(gateway => (
                  <Link key={gateway.title} href={gateway.href}>
                    <div className={`p-4 border border-neutral-800 rounded-xl bg-neutral-950/40 text-left transition-all cursor-pointer ${gateway.bg}`}>
                      <h4 className="text-[12px] font-bold text-white">{gateway.title}</h4>
                      <p className="text-[10px] text-neutral-500 font-light mt-0.5">{gateway.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <footer className="w-full max-w-6xl mx-auto pt-6 border-t border-neutral-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-neutral-500 text-[11px] font-light z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Geo-Fence Protection Active • Takeaway Bypasses Bounds</span>
        </div>

        <span>© 2026 AURYN Inc. All rights reserved.</span>
      </footer>
    </main>
  );
}
