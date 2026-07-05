'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Compass, Clock, Award, ShieldCheck, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function RestaurantLanding() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-neutral-900 flex flex-col justify-between p-6 md:p-12 selection:bg-neutral-200">
      
      {/* Top Header branding */}
      <div className="w-full max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full animate-pulse" />
          <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-neutral-900">AURYN</span>
        </div>

        {/* Small subtle indicator */}
        <span className="text-[11px] font-bold text-neutral-450 uppercase tracking-widest">
          Est. 2026
        </span>
      </div>

      {/* Main Brand Presentation */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center my-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* VisionOS-style logo badge */}
          <div className="w-14 h-14 bg-white rounded-2xl border border-[#ECECEC] flex items-center justify-center shadow-luxury mb-8">
            <Sparkles className="w-6 h-6 text-amber-500" />
          </div>

          <h1 className="text-3xl md:text-5xl font-light text-neutral-950 tracking-[-0.03em] leading-tight max-w-2xl">
            Fine Dining Orchestrated <br />
            <span className="font-semibold text-black">Intelligently by AURYN</span>
          </h1>

          <p className="mt-5 text-[14px] md:text-[15px] text-neutral-500 max-w-md font-light leading-relaxed">
            Welcome to AURYN. Scan the permanent QR code at your table to initialize your dining experience, browse the chef specials, and interact with the restaurant concierge.
          </p>
        </motion.div>

        {/* Features Walkthrough Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mt-16"
        >
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-[20px] border border-[#ECECEC] shadow-luxury text-left">
            <div className="w-9 h-9 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 mb-4">
              <Compass className="w-4.5 h-4.5 text-neutral-900" />
            </div>
            <h3 className="text-[13px] font-semibold text-neutral-950 uppercase tracking-wide">1. Scan & Onboard</h3>
            <p className="text-[12px] text-neutral-500 mt-2 font-light leading-relaxed">
              Scan the physical table QR code with your mobile camera. We verify your geolocation to securely lock the session to your device.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-[20px] border border-[#ECECEC] shadow-luxury text-left">
            <div className="w-9 h-9 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 mb-4">
              <Sparkles className="w-4.5 h-4.5 text-neutral-900" />
            </div>
            <h3 className="text-[13px] font-semibold text-neutral-950 uppercase tracking-wide">2. AI Concierge</h3>
            <p className="text-[12px] text-neutral-500 mt-2 font-light leading-relaxed">
              Query the concierge for wine pairings, ingredient allergens, or budget selections. Add orders instantly via conversational commands.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-[20px] border border-[#ECECEC] shadow-luxury text-left">
            <div className="w-9 h-9 bg-neutral-50 rounded-lg flex items-center justify-center border border-neutral-100 mb-4">
              <Clock className="w-4.5 h-4.5 text-neutral-900" />
            </div>
            <h3 className="text-[13px] font-semibold text-neutral-950 uppercase tracking-wide">3. Track & Complete</h3>
            <p className="text-[12px] text-neutral-500 mt-2 font-light leading-relaxed">
              Track kitchen preparation queues and runner walks. Clear your invoice directly from your screen when ready to depart.
            </p>
          </div>
        </motion.div>

        {/* Dynamic Workspace Gateway */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl mt-12 bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-4 text-left"
        >
          <div>
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-0.5">Dynamic Workspace Engine</span>
            <h3 className="text-[14px] font-bold text-neutral-950 uppercase tracking-wide">Ecosystem Workspaces Portal</h3>
            <p className="text-[12px] text-neutral-500 font-light mt-0.5">
              AURYN automatically activates the appropriate workspace interface depending on the authenticated user's role and geolocation.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {[
              { title: 'Customer', desc: 'Scan signed QR code', href: '/table/1', icon: Compass, color: 'text-amber-500 bg-amber-50' },
              { title: 'Kitchen', desc: 'Realtime hot deck & AI', href: '/kitchen', icon: Sparkles, color: 'text-indigo-600 bg-indigo-50' },
              { title: 'Runner', desc: 'Task dispatch console', href: '/runner', icon: Clock, color: 'text-purple-600 bg-purple-50' },
              { title: 'Executive', desc: 'Mission Control Hub', href: '/admin', icon: Award, color: 'text-emerald-600 bg-emerald-50' }
            ].map(workspace => (
              <Link key={workspace.title} href={workspace.href}>
                <div className="p-4 rounded-2xl border border-[#ECECEC] hover:border-neutral-950 transition-all cursor-pointer space-y-2 bg-[#FAFAFA]/50 group">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${workspace.color}`}>
                    <workspace.icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-bold text-neutral-900 group-hover:text-black">{workspace.title}</h4>
                    <p className="text-[10px] text-neutral-500 font-light mt-0.5">{workspace.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer Gateway */}
      <footer className="w-full max-w-6xl mx-auto pt-6 border-t border-[#ECECEC] flex flex-col sm:flex-row justify-between items-center gap-4 text-neutral-400 text-[11px] font-light">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Geo-Fence Protection Active • 50-meter Operational Radius</span>
        </div>

        {/* Staff Entry Gateway link */}
        <Link href="/login">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-400 hover:text-neutral-950 transition-colors uppercase tracking-wider cursor-pointer">
            <LogIn className="w-3.5 h-3.5" />
            <span>Staff Portal Login</span>
          </div>
        </Link>
      </footer>
    </main>
  );
}
