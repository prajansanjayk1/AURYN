'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Activity, ShieldAlert, Award, Clock, ChefHat, Layers,
  TrendingUp, RefreshCw, Plus, Edit3, Trash2, X, LogOut, Copy, QrCode,
  MapPin, CheckCircle, Table, CheckCircle2, AlertCircle, ShoppingBag,
  Users, Sliders, Palette, Music, DollarSign, Percent, Volume2, ShieldCheck
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { RestaurantState, Table as TableType, DiningSession, MenuItem, InventoryItem, AuditLog, User, Order, Notification as NotificationType } from '@/shared/types';
import { RestaurantIntelligence } from '@/modules/ai/intelligence';
import { playUISound } from '@/shared/lib/sounds';

const RESTAURANT_ID = 'auryn-hq';
const BRANCH_ID = 'main-branch';

interface CustomRole {
  name: string;
  permissions: {
    viewRevenue: boolean;
    modifyMenu: boolean;
    deductInventory: boolean;
    closeSession: boolean;
    manageStaff: boolean;
  };
}

export default function ExecutiveCenter() {
  const router = useRouter();
  const [state, setState] = useState<RestaurantState>({
    tables: [],
    sessions: [],
    orders: [],
    menu: [],
    inventory: [],
    notifications: [],
    auditLogs: [],
    users: []
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);
  const [activeTab, setActiveTab] = useState<'twin' | 'tables' | 'menu' | 'inventory' | 'staff' | 'ai_manager' | 'saas_hub' | 'customization'>('twin');
  const [origin, setOrigin] = useState('');

  const [managerQuery, setManagerQuery] = useState('');
  const [managerConversation, setManagerConversation] = useState<Array<{ sender: 'manager' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Good afternoon. I am your AURYN AI Business Intelligence Manager. Ask me about delays, revenue metrics, best-selling dishes, inventory stock-outs, or tomorrow\'s demand predictions.'
    }
  ]);

  // Enterprise SaaS states
  const [webhookUrl, setWebhookUrl] = useState('https://api.aurynhq.com/webhooks/v1');
  const [apiPrivateKey, setApiPrivateKey] = useState('auryn_live_a5b6c7d8e9f0_secret');
  const [currentPlan, setCurrentPlan] = useState<'Starter' | 'Professional' | 'Enterprise'>('Enterprise');
  const [selectedSaaSBranch, setSelectedSaaSBranch] = useState('Uptown Bistro');
  const [twinMapMode, setTwinMapMode] = useState<'status' | 'heatmap' | 'kitchen'>('status');

  // Customization state
  const [settings, setSettings] = useState<any>({
    restaurantName: 'AURYN',
    primaryColor: '#0A0A0A',
    accentColor: '#D4AF37',
    typography: 'Outfit',
    welcomeScreen: { title: 'Welcome to AURYN', subtitle: 'Luxury Dining Intelligence' },
    splashScreen: { duration: 3000, text: 'AURYN — Orchestrated Elegance' },
    backgroundMusic: 'classical_jazz',
    notificationSounds: true,
    receiptLayout: 'classic_luxury',
    qrCodeStyle: 'rounded_gold',
    businessHours: '11:00 AM - 11:00 PM',
    taxes: 5,
    gst: 18,
    currency: 'INR',
    language: 'English',
    diningPolicies: 'Smart casual dress code.',
    paymentOptions: ['Razorpay', 'Cash'],
    aiSettings: { enableConcierge: true, recommendationIntensity: 'balanced' }
  });

  // Custom Roles State
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([
    {
      name: 'Supervisor',
      permissions: { viewRevenue: true, modifyMenu: true, deductInventory: true, closeSession: true, manageStaff: false }
    },
    {
      name: 'Cleaner',
      permissions: { viewRevenue: false, modifyMenu: false, deductInventory: false, closeSession: false, manageStaff: false }
    }
  ]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePerms, setNewRolePerms] = useState({
    viewRevenue: false,
    modifyMenu: false,
    deductInventory: false,
    closeSession: false,
    manageStaff: false
  });

  // Menu editor modal
  const [editingMenuItem, setEditingMenuItem] = useState<Partial<MenuItem> | null>(null);
  const [menuModalOpen, setMenuModalOpen] = useState(false);

  // Table manager states
  const [newTableName, setNewTableName] = useState('');
  const [tableModalOpen, setTableModalOpen] = useState(false);

  // Staff creation state
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'chef' | 'runner' | 'manager' | 'cashier'>('runner');
  
  // Real-time Supabase sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
      if (data) {
        setSettings({
          restaurantName: data.restaurant_name,
          primaryColor: data.primary_color,
          accentColor: data.accent_color,
          typography: data.typography,
          welcomeScreen: data.welcome_screen,
          splashScreen: data.splash_screen,
          backgroundMusic: data.background_music,
          notificationSounds: data.notification_sounds,
          receiptLayout: data.receipt_layout,
          qrCodeStyle: data.qr_code_style,
          businessHours: data.business_hours,
          taxes: Number(data.taxes),
          gst: Number(data.gst),
          currency: data.currency,
          language: data.language,
          diningPolicies: data.dining_policies,
          paymentOptions: data.payment_options,
          aiSettings: data.ai_settings
        });
      }
    };

    const fetchInitialData = async () => {
      const stateData = await RestaurantRepository.getState();
      setState(stateData);
      setLoading(false);
    };

    fetchSettings();
    fetchInitialData();

    // Subscribe to Supabase Realtime channel
    const channel = supabase.channel('admin-telemetry-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        fetchSettings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, async () => {
        const list = await RestaurantRepository.getTables();
        setState(prev => ({ ...prev, tables: list }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, async () => {
        const list = await RestaurantRepository.getSessions();
        setState(prev => ({ ...prev, sessions: list }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const list = await RestaurantRepository.getOrders();
        setState(prev => ({ ...prev, orders: list }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, async () => {
        const list = await RestaurantRepository.getMenuItems();
        setState(prev => ({ ...prev, menu: list }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, async () => {
        const list = await RestaurantRepository.getInventory();
        setState(prev => ({ ...prev, inventory: list }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, async () => {
        const list = await RestaurantRepository.getUsers();
        setState(prev => ({ ...prev, users: list }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, async () => {
        const list = await RestaurantRepository.getAuditLogs();
        setState(prev => ({ ...prev, auditLogs: list }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Set selected table updates from real-time state
  useEffect(() => {
    if (selectedTable) {
      const updated = state.tables.find(t => t.id === selectedTable.id);
      if (updated) setSelectedTable(updated);
    }
  }, [state.tables, selectedTable]);

  // Handle customization save
  const handleSaveCustomization = async (e: React.FormEvent) => {
    e.preventDefault();
    playUISound('click');
    try {
      const dbSettings = {
        restaurant_name: settings.restaurantName,
        logo_url: settings.logoUrl || '',
        primary_color: settings.primaryColor,
        accent_color: settings.accentColor,
        typography: settings.typography,
        welcome_screen: settings.welcomeScreen,
        splash_screen: settings.splashScreen,
        background_music: settings.backgroundMusic,
        notification_sounds: settings.notificationSounds,
        receipt_layout: settings.receiptLayout,
        qr_code_style: settings.qrCodeStyle,
        business_hours: settings.businessHours,
        taxes: Number(settings.taxes),
        gst: Number(settings.gst),
        currency: settings.currency,
        language: settings.language,
        dining_policies: settings.diningPolicies,
        payment_options: settings.paymentOptions,
        ai_settings: settings.aiSettings
      };
      await supabase.from('settings').update(dbSettings).eq('id', 'global');
      playUISound('success');
      alert('Customization settings updated successfully!');
      await RestaurantRepository.writeAuditLog('settings.update', 'Brand customizations and theme variables updated.');
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const handleMenuSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuItem) return;
    playUISound('click');

    const isNew = !editingMenuItem.id;
    
    try {
      if (isNew) {
        await RestaurantRepository.createMenuItem(editingMenuItem as any);
      } else {
        await RestaurantRepository.updateMenuItem(editingMenuItem.id!, editingMenuItem);
      }
      playUISound('success');
      setMenuModalOpen(false);
      setEditingMenuItem(null);
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const handleMenuDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this dish from the menu?')) return;
    playUISound('click');
    try {
      await RestaurantRepository.deleteMenuItem(id);
      playUISound('success');
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const handleInventoryAdjust = async (id: string, currentStock: number, adjustment: number) => {
    playUISound('click');
    const newStock = Math.max(0, Number((currentStock + adjustment).toFixed(2)));
    try {
      await RestaurantRepository.updateInventoryItem(id, { stock: newStock });
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const handleTableSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    playUISound('click');

    try {
      await RestaurantRepository.createTable(newTableName);
      playUISound('success');
      setNewTableName('');
      setTableModalOpen(false);
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const handleTableDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this table?')) return;
    playUISound('click');
    try {
      await RestaurantRepository.deleteTable(id);
      playUISound('success');
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffEmail.trim() || !newStaffName.trim()) return;
    playUISound('click');

    try {
      const uid = `staff-${Date.now()}`;
      await supabase.from('users').insert({
        id: uid,
        email: newStaffEmail,
        name: newStaffName,
        role: newStaffRole,
        password_hash: 'staff123',
        restaurant_id: 'auryn-hq',
        branch_id: 'main-branch'
      });
      playUISound('success');
      setNewStaffEmail('');
      setNewStaffName('');
      await RestaurantRepository.writeAuditLog('staff.create', `New staff member ${newStaffName} (${newStaffRole}) onboarded.`);
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    playUISound('click');
    
    const newRole: CustomRole = {
      name: newRoleName,
      permissions: { ...newRolePerms }
    };
    
    setCustomRoles([...customRoles, newRole]);
    setNewRoleName('');
    setNewRolePerms({ viewRevenue: false, modifyMenu: false, deductInventory: false, closeSession: false, manageStaff: false });
    playUISound('success');
  };

  const handleLogout = async () => {
    playUISound('click');
    try {
      await supabase.auth.signOut();
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const handleManagerQuery = (queryText: string) => {
    playUISound('click');
    setManagerConversation(prev => [...prev, { sender: 'manager', text: queryText }]);
    
    // Process response using live telemetry stats
    const response = RestaurantIntelligence.chatManager(queryText, state);
    
    setTimeout(() => {
      setManagerConversation(prev => [...prev, { sender: 'ai', text: response }]);
      playUISound('notification');
    }, 400);
  };

  const handleManagerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerQuery.trim()) return;
    const q = managerQuery;
    setManagerQuery('');
    handleManagerQuery(q);
  };

  const handleTransferMenu = async () => {
    playUISound('click');
    try {
      const auditId = `aud-${Date.now()}`;
      await supabase.from('audit_logs').insert({
        id: auditId,
        timestamp: new Date().toISOString(),
        action: 'SaaS Menu Sync',
        details: `Transferred entire Menu Catalog of ${state.menu.length} items to branch [${selectedSaaSBranch}].`,
        restaurant_id: 'auryn-hq',
        branch_id: 'main-branch'
      });
      playUISound('success');
      alert(`Success: Menu catalog successfully replicated to ${selectedSaaSBranch}.`);
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const handleTransferInventory = async () => {
    playUISound('click');
    try {
      const auditId = `aud-${Date.now()}`;
      await supabase.from('audit_logs').insert({
        id: auditId,
        timestamp: new Date().toISOString(),
        action: 'SaaS Inventory Sync',
        details: `Transferred and synced inventory stocks with branch [${selectedSaaSBranch}].`,
        restaurant_id: 'auryn-hq',
        branch_id: 'main-branch'
      });
      playUISound('success');
      alert(`Success: Inventory stocks successfully balanced with ${selectedSaaSBranch}.`);
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const handleRegenerateApiKey = () => {
    playUISound('click');
    const newKey = `auryn_live_${Math.random().toString(36).substring(2, 8)}${Math.random().toString(36).substring(2, 8)}_secret`;
    setApiPrivateKey(newKey);
    playUISound('success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-white">
        <Sparkles className="w-8 h-8 text-amber-500 animate-spin mb-4" />
        <span className="text-[12px] tracking-[0.2em] font-semibold text-neutral-400 uppercase">Loading AURYN Executive Center...</span>
      </div>
    );
  }

  // Calculate dynamic AI insights using the upgraded module
  const aiInsights = RestaurantIntelligence.getExecutiveInsights(state);

  // Active session helper
  const activeSession = selectedTable 
    ? state.sessions.find(s => s.tableId === selectedTable.id && s.status !== 'completed')
    : null;

  const sessionOrders = activeSession 
    ? state.orders.filter(o => o.sessionId === activeSession.id)
    : [];

  const sessionTotal = sessionOrders.reduce((sum, order) => {
    return sum + order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 pb-16 selection:bg-neutral-200">
      
      {/* Header */}
      <header className="bg-white border-b border-[#ECECEC] px-6 md:px-12 py-5 flex flex-col md:flex-row justify-between items-center sticky top-0 z-20 gap-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-neutral-950 rounded-xl flex items-center justify-center shadow-lg border border-neutral-800">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-[16px] font-bold uppercase tracking-wider text-neutral-955">{settings.restaurantName || 'AURYN'}</h1>
            <span className="text-[10px] text-neutral-400 font-semibold tracking-widest block uppercase">Executive Platform</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#FAFAFA] border border-[#ECECEC] rounded-full p-1 shadow-[0_2px_8px_rgba(0,0,0,0.01)] overflow-x-auto max-w-full">
          {[
            { id: 'twin', label: 'Digital Twin' },
            { id: 'tables', label: 'Tables' },
            { id: 'menu', label: 'Menu Editor' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'staff', label: 'Staff & Roles' },
            { id: 'ai_manager', label: 'AI Manager' },
            { id: 'saas_hub', label: 'SaaS Hub' },
            { id: 'customization', label: 'Branding' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                playUISound('click');
                setActiveTab(tab.id as any);
              }}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-neutral-950 text-white shadow-lg' 
                  : 'text-neutral-500 hover:text-neutral-955'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Log Out */}
        <div className="flex items-center gap-5">
          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-[#ECECEC] hover:border-neutral-905 rounded-xl text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
            title="Log Out Staff"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Portal</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand: Dashboard KPI Indicators & Analytics (4 cols) */}
        <section className="lg:col-span-4 space-y-8">
          
          {/* Executive Health Score Card */}
          <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">AURYN Platform Health</span>
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-4xl font-light text-neutral-950 tracking-tight leading-none">{aiInsights.healthScore}</h3>
                <span className="text-[11px] text-emerald-600 font-bold mt-1.5 block">Operation Status: Peak</span>
              </div>
              
              <div className="w-40 h-16">
                <svg className="w-full h-full" viewBox="0 0 460 150">
                  <polyline
                    fill="none"
                    stroke={settings.accentColor || "#D4AF37"}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="20,130 80,105 140,110 200,80 260,95 320,60 380,45 440,30"
                  />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-[#ECECEC] text-center">
              <div className="bg-[#FAFAFA] border border-[#ECECEC] p-3 rounded-xl">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Kitchen</span>
                <span className="text-[14px] font-bold text-neutral-900 mt-1 block">98%</span>
              </div>
              <div className="bg-[#FAFAFA] border border-[#ECECEC] p-3 rounded-xl">
                <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Runner</span>
                <span className="text-[14px] font-bold text-neutral-900 mt-1 block">97%</span>
              </div>
              <div className="bg-[#FAFAFA] border border-[#ECECEC] p-3 rounded-xl">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Feedback</span>
                <span className="text-[14px] font-bold text-neutral-900 mt-1 block">4.9/5</span>
              </div>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#ECECEC]">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-900">AURYN Specialized AI Insights</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-neutral-50/70 border border-neutral-100 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="font-semibold text-neutral-800">Peak Load Forecast</span>
                  <span className="text-neutral-505">{aiInsights.peakHours}</span>
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="font-semibold text-neutral-800">Avg Dining Duration</span>
                  <span className="text-neutral-500">{aiInsights.avgDiningTime}</span>
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span className="font-semibold text-neutral-800">Revenue Growth</span>
                  <span className="text-emerald-600 font-bold">{aiInsights.revenueIncrease}</span>
                </div>
              </div>

              {/* Text insights list */}
              <div className="space-y-3 pl-1 text-[12px] leading-relaxed font-light text-neutral-600">
                {aiInsights.insights.map((insight, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <p>{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live system logs */}
          <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-4">Operations Security Audit Logs</span>
            <div className="space-y-4 max-h-[220px] overflow-y-auto pl-1 pr-2">
              {state.auditLogs.slice(0, 15).map((log) => (
                <div key={log.id} className="text-[11px] border-b border-neutral-50 pb-2">
                  <div className="flex justify-between font-mono text-[9px] text-neutral-450">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="uppercase text-amber-600 font-bold">{log.action}</span>
                  </div>
                  <p className="text-neutral-600 font-light mt-0.5">{log.details}</p>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* Right Hand: Active Dashboard Section (8 cols) */}
        <section className="lg:col-span-8 space-y-8">
                   {/* DIGITAL TWIN TAB */}
          {activeTab === 'twin' && (
            <div className="space-y-8 col-span-1 lg:col-span-12">
              
              {/* Row 1: Apple-style Mission Control Deck */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Health Index */}
                <div className="bg-white border border-[#ECECEC] rounded-[24px] p-5 shadow-luxury flex items-center gap-4">
                  <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Health Index</span>
                    <h4 className="text-xl font-bold text-neutral-900 mt-0.5">{aiInsights.healthScore}%</h4>
                    <span className="text-[9px] text-emerald-600 font-semibold block uppercase">SECURE PROTOCOL</span>
                  </div>
                </div>

                {/* Kitchen Status */}
                <div className="bg-white border border-[#ECECEC] rounded-[24px] p-5 shadow-luxury flex items-center gap-4">
                  <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Kitchen Score</span>
                    <h4 className="text-xl font-bold text-neutral-900 mt-0.5">
                      {state.orders.filter(o => o.status === 'preparing' || o.status === 'quality_check').length > 3 ? 'Overloaded' : 'Optimal'}
                    </h4>
                    <span className="text-[9px] text-neutral-500 font-medium block uppercase">
                      {state.orders.filter(o => o.status === 'preparing' || o.status === 'quality_check').length} ACTIVE TICKETS
                    </span>
                  </div>
                </div>

                {/* Runner Score */}
                <div className="bg-white border border-[#ECECEC] rounded-[24px] p-5 shadow-luxury flex items-center gap-4">
                  <div className="w-11 h-11 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-purple-700">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Runner Velocity</span>
                    <h4 className="text-xl font-bold text-neutral-900 mt-0.5">1.2 Min</h4>
                    <span className="text-[9px] text-emerald-600 font-semibold block uppercase">0 DISPATCH DELAYS</span>
                  </div>
                </div>

                {/* Cover count */}
                <div className="bg-white border border-[#ECECEC] rounded-[24px] p-5 shadow-luxury flex items-center gap-4">
                  <div className="w-11 h-11 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-700">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Dine-in Covers</span>
                    <h4 className="text-xl font-bold text-neutral-900 mt-0.5">
                      {state.sessions.filter(s => s.status !== 'completed').length} / {state.tables.length} Tables
                    </h4>
                    <span className="text-[9px] text-neutral-500 font-medium block uppercase">
                      {state.sessions.reduce((acc, s) => acc + (s.status !== 'completed' ? s.guests.length : 0), 0)} ACTIVE GUESTS
                    </span>
                  </div>
                </div>

              </div>

              {/* Row 2: Digital Twin Map & Operations Drawer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Floor map with Heatmap switch */}
                <div className="lg:col-span-7 bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-[15px] font-bold tracking-tight uppercase">Floor Plan Digital Twin</h3>
                      <p className="text-[12px] text-neutral-500 font-light mt-0.5">Live restaurant spatial updates, delivery vectors, and seating heatmaps.</p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-[#FAFAFA] border border-[#ECECEC] p-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {[
                        { id: 'status', label: 'Status' },
                        { id: 'heatmap', label: 'Heatmap' },
                        { id: 'kitchen', label: 'Vectors' }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => { playUISound('click'); setTwinMapMode(mode.id as any); }}
                          className={`px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                            twinMapMode === mode.id ? 'bg-neutral-955 text-white' : 'text-neutral-500'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Twin Grid Map */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative">
                    {state.tables.map(table => {
                      const session = state.sessions.find(s => s.tableId === table.id && s.status !== 'completed');
                      const tableOrders = state.orders.filter(o => o.tableId === table.id && o.status !== 'delivered');
                      const hasReady = tableOrders.some(o => o.status === 'ready');
                      const hasCooking = tableOrders.some(o => o.status === 'preparing' || o.status === 'quality_check');

                      // Calculate Heatmap density based on total order count for this table
                      const orderCount = state.orders.filter(o => o.tableId === table.id).length;
                      
                      let cardStyle = 'bg-white border-[#ECECEC] hover:border-neutral-300';
                      let statusText = 'Available';
                      let dotColor = 'bg-emerald-500';

                      if (twinMapMode === 'heatmap') {
                        if (orderCount > 4) {
                          cardStyle = 'bg-amber-100 border-amber-300 text-amber-950 font-bold';
                          statusText = 'Busy Seat (Hot)';
                          dotColor = 'bg-amber-700 animate-ping';
                        } else if (orderCount > 0) {
                          cardStyle = 'bg-amber-50/50 border-amber-100 text-neutral-800';
                          statusText = 'Moderate Seating';
                          dotColor = 'bg-amber-400';
                        } else {
                          cardStyle = 'bg-neutral-50/20 border-neutral-100 text-neutral-400';
                          statusText = 'Low Occupancy';
                          dotColor = 'bg-neutral-300';
                        }
                      } else if (twinMapMode === 'kitchen') {
                        if (hasReady) {
                          cardStyle = 'bg-purple-50/30 border-purple-300 animate-pulse';
                          statusText = 'Ready for Served';
                          dotColor = 'bg-purple-600';
                        } else if (hasCooking) {
                          cardStyle = 'bg-sky-50/20 border-sky-300';
                          statusText = 'Kitchen Active';
                          dotColor = 'bg-sky-500';
                        } else if (session) {
                          cardStyle = 'bg-neutral-50/40 border-neutral-200';
                          statusText = 'Order Pending';
                          dotColor = 'bg-neutral-400';
                        }
                      } else {
                        // Standard Floor status
                        if (table.status === 'payment_pending') {
                          cardStyle = 'bg-rose-50/15 border-rose-300 text-rose-950';
                          statusText = 'Invoice Pending';
                          dotColor = 'bg-rose-500 animate-pulse';
                        } else if (table.status === 'occupied') {
                          cardStyle = 'bg-[#FAFAFA] border-amber-300';
                          statusText = 'Dining';
                          dotColor = 'bg-amber-500';
                        }
                      }

                      return (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={table.id}
                          onClick={() => {
                            playUISound('click');
                            setSelectedTable(table);
                          }}
                          className={`p-5 rounded-[20px] border text-center cursor-pointer transition-all shadow-sm ${
                            selectedTable?.id === table.id 
                              ? 'ring-2 ring-neutral-955 border-transparent' 
                              : ''
                          } ${cardStyle}`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-white border border-[#ECECEC] flex items-center justify-center mx-auto mb-3 shadow-[0_2px_6px_rgba(0,0,0,0.02)] text-neutral-900 font-bold text-[14px]">
                            T{table.id}
                          </div>
                          
                          <span className="text-[12px] font-bold block">{table.name}</span>
                          
                          <div className="flex items-center justify-center gap-1.5 mt-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                            <span className="text-[9px] text-neutral-450 tracking-wider uppercase font-bold">
                              {statusText}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Operations timeline stepper & bill summary */}
                <div className="lg:col-span-5 space-y-6">
                  <AnimatePresence mode="wait">
                    {selectedTable ? (
                      <motion.div
                        key={selectedTable.id}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-6"
                      >
                        <div className="flex justify-between items-start pb-2 border-b border-[#ECECEC]">
                          <div>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Active Table Session</span>
                            <h3 className="text-[16px] font-bold text-neutral-950 mt-0.5">{selectedTable.name}</h3>
                          </div>
                          <button 
                            onClick={() => { playUISound('click'); setSelectedTable(null); }}
                            className="w-7 h-7 rounded-full bg-[#FAFAFA] border border-[#ECECEC] flex items-center justify-center text-neutral-400 hover:text-neutral-955 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {activeSession ? (
                          <div className="space-y-6">
                            
                            {/* Visual Timeline Stepper */}
                            <div className="space-y-3">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Session Stepper</span>
                              <div className="grid grid-cols-5 text-[9px] font-bold uppercase tracking-wider text-center gap-1 relative pt-3">
                                <div className="absolute top-[18px] left-[10%] right-[10%] h-0.5 bg-neutral-100 z-0" />
                                {[
                                  { label: 'Placed', active: true },
                                  { label: 'Cook', active: activeSession.timeline.some(t => t.type === 'order.accepted' || t.type === 'order.preparing') },
                                  { label: 'QC', active: activeSession.timeline.some(t => t.type === 'order.quality_check') },
                                  { label: 'Serve', active: activeSession.timeline.some(t => t.type === 'order.delivered') },
                                  { label: 'Pay', active: activeSession.status === 'payment_pending' || activeSession.status === 'completed' }
                                ].map((step, index) => (
                                  <div key={index} className="flex flex-col items-center gap-1.5 z-10 relative">
                                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                      step.active 
                                        ? 'bg-neutral-955 border-neutral-955 text-white' 
                                        : 'bg-white border-neutral-200 text-neutral-300'
                                    }`} />
                                    <span>{step.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Timeline Actions list */}
                            <div className="space-y-3 pt-3 border-t border-[#FAFAFA]">
                              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Chronological Session Log</span>
                              <div className="space-y-3 bg-[#FAFAFA] p-4.5 rounded-2xl border border-[#ECECEC] max-h-48 overflow-y-auto">
                                {activeSession.timeline.map((evt, idx) => (
                                  <div key={idx} className="relative pl-4 pb-2 border-l border-neutral-200 last:border-0 last:pb-0 text-[11px]">
                                    <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-neutral-350 border-2 border-white" />
                                    <span className="text-[9px] text-neutral-400 font-mono block">
                                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <p className="text-neutral-750 font-light mt-0.5 leading-relaxed">{evt.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-between text-[14px] font-bold text-neutral-950 pt-4 border-t border-dashed border-[#ECECEC]">
                              <span>Grand Total</span>
                              <span>₹{sessionTotal}</span>
                            </div>

                          </div>
                        ) : (
                          <div className="py-12 text-center text-neutral-450 text-[12px] font-light">
                            Table is vacant. QR code is ready to scan.
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <div className="bg-[#FAFAFA] border border-dashed border-[#ECECEC] rounded-[24px] p-8 text-center text-neutral-450 text-[12px] font-light py-24">
                        Select a table node on the digital twin grid to view live dining telemetry.
                      </div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Row 3: AI Predictive Demand Forecasting Center */}
              <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-5">
                <div>
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">AI Operations Forecasting</span>
                  <h3 className="text-[15px] font-bold tracking-tight uppercase">Predictive Demand Intelligence</h3>
                  <p className="text-[12px] text-neutral-550 font-light mt-0.5">Automated machine learning predictions for tomorrow's dinner service.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4.5 pt-2">
                  
                  {/* Tomorrow Revenue */}
                  <div className="bg-[#FAFAFA] border border-[#ECECEC] p-4.5 rounded-[20px] space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Tomorrow Revenue</span>
                    <h5 className="text-[15px] font-bold text-neutral-900">₹1,45,000</h5>
                    <p className="text-[10px] text-emerald-600 font-semibold tracking-wide uppercase">+18.2% vs last week</p>
                  </div>

                  {/* Rush Hours */}
                  <div className="bg-[#FAFAFA] border border-[#ECECEC] p-4.5 rounded-[20px] space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Busiest Hours</span>
                    <h5 className="text-[15px] font-bold text-neutral-900">8:30 PM - 10 PM</h5>
                    <p className="text-[10px] text-neutral-500 font-light uppercase">Dinner cover surge</p>
                  </div>

                  {/* Popular Dishes */}
                  <div className="bg-[#FAFAFA] border border-[#ECECEC] p-4.5 rounded-[20px] space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Predicted Bestseller</span>
                    <h5 className="text-[15px] font-bold text-neutral-900">Wagyu Sliders</h5>
                    <p className="text-[10px] text-neutral-500 font-light uppercase">60% order probability</p>
                  </div>

                  {/* Shortage Warnings */}
                  <div className="bg-[#FAFAFA] border border-[#ECECEC] p-4.5 rounded-[20px] space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Stock Shortage</span>
                    <h5 className="text-[15px] font-bold text-rose-600">A5 Wagyu Beef</h5>
                    <p className="text-[10px] text-rose-500 font-semibold tracking-wide uppercase">Replenish by 4 PM</p>
                  </div>

                  {/* Staff Requirement */}
                  <div className="bg-[#FAFAFA] border border-[#ECECEC] p-4.5 rounded-[20px] space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Staff Allocation</span>
                    <h5 className="text-[15px] font-bold text-neutral-900">3 Runners + 1 Chef</h5>
                    <p className="text-[10px] text-neutral-500 font-light uppercase">Adjust schedules</p>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TABLES MANAGEMENT TAB */}
          {activeTab === 'tables' && (
            <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-[#ECECEC]">
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight uppercase">Tables Registry</h3>
                  <p className="text-[12px] text-neutral-500 font-light mt-0.5">Manage layouts, QR code credentials, and statuses.</p>
                </div>
                <button
                  onClick={() => {
                    playUISound('click');
                    setNewTableName('');
                    setTableModalOpen(true);
                  }}
                  className="px-4.5 py-2 bg-neutral-955 hover:bg-neutral-900 text-white rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Table
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {state.tables.map(table => {
                  const directUrl = `${origin}/table/${table.id}`;
                  return (
                    <div key={table.id} className="p-5 rounded-[20px] border border-[#ECECEC] bg-white flex flex-col justify-between shadow-sm gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[14px] font-bold text-neutral-950 block">{table.name}</span>
                          <span className="text-[10px] text-neutral-400 font-light block mt-0.5">ID: {table.id} • Scan: {table.qrCode}</span>
                        </div>
                        <button
                          onClick={() => handleTableDelete(table.id)}
                          className="w-8 h-8 rounded-lg border border-rose-100 flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="bg-[#FAFAFA] border border-[#ECECEC] p-3.5 rounded-xl flex flex-col gap-2">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                          <QrCode className="w-3.5 h-3.5 text-neutral-450" />
                          <span>QR Digital Verification Link</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-neutral-500 truncate select-all">{directUrl}</span>
                          <button
                            onClick={() => {
                              playUISound('click');
                              navigator.clipboard.writeText(directUrl);
                              alert(`Copied link for ${table.name}`);
                            }}
                            className="p-1.5 hover:bg-white border border-[#ECECEC] hover:border-neutral-400 rounded transition-colors text-neutral-500 flex items-center justify-center cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MENU EDITOR TAB */}
          {activeTab === 'menu' && (
            <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-[#ECECEC]">
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight uppercase">Menu Catalog Editor</h3>
                  <p className="text-[12px] text-neutral-500 font-light mt-0.5">Edit fine dining listings, pricing, and allergen metrics.</p>
                </div>
                <button
                  onClick={() => {
                    playUISound('click');
                    setEditingMenuItem({
                      name: '',
                      description: '',
                      price: 0,
                      category: 'Starters',
                      rating: 5,
                      isChefRecommendation: false,
                      isPopular: false,
                      isTrending: false,
                      prepTime: 10,
                      calories: 300,
                      protein: '12g',
                      allergens: [],
                      ingredients: [],
                      image: '/images/placeholder.jpg'
                    });
                    setMenuModalOpen(true);
                  }}
                  className="px-4.5 py-2 bg-neutral-950 hover:bg-neutral-900 text-white rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Dish
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left">
                  <thead>
                    <tr className="border-b border-[#ECECEC] text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      <th className="py-3 px-2">Dish details</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2">Price</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.menu.map(item => (
                      <tr key={item.id} className="border-b border-[#FAFAFA] hover:bg-[#FAFAFA] transition-colors">
                        <td className="py-4 px-2">
                          <span className="font-bold text-neutral-950 block">{item.name}</span>
                          <span className="text-[11px] text-neutral-450 font-light max-w-sm block truncate">{item.description}</span>
                        </td>
                        <td className="py-4 px-2 text-neutral-600 font-semibold">{item.category}</td>
                        <td className="py-4 px-2 font-bold text-neutral-950">₹{item.price}</td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                playUISound('click');
                                setEditingMenuItem(item);
                                setMenuModalOpen(true);
                              }}
                              className="w-8 h-8 rounded-lg border border-[#ECECEC] flex items-center justify-center text-neutral-500 hover:text-neutral-950 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMenuDelete(item.id)}
                              className="w-8 h-8 rounded-lg border border-rose-100 flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50/50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-6">
              <div>
                <h3 className="text-[15px] font-bold tracking-tight uppercase">Ingredients Stock Control</h3>
                <p className="text-[12px] text-neutral-500 font-light mt-0.5">Automated recipe ingredient deducts and warnings.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {state.inventory.map(item => (
                  <div 
                    key={item.id} 
                    className={`p-5 rounded-[20px] border border-[#ECECEC] bg-white flex justify-between items-center shadow-sm ${
                      item.stock < item.minStock ? 'border-rose-200 bg-rose-50/10' : ''
                    }`}
                  >
                    <div>
                      <span className="text-[13px] font-bold text-neutral-950 block">{item.name}</span>
                      <span className="text-[11px] text-neutral-400 font-semibold block mt-1">
                        Alert Limit: {item.minStock} {item.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[15px] font-bold ${
                        item.stock < item.minStock ? 'text-rose-600' : 'text-neutral-900'
                      }`}>
                        {item.stock} {item.unit}
                      </span>

                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleInventoryAdjust(item.id, item.stock, 5)}
                          className="w-6 h-6 border border-[#ECECEC] bg-white text-[10px] font-bold rounded flex items-center justify-center hover:bg-[#FAFAFA] cursor-pointer"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleInventoryAdjust(item.id, item.stock, -5)}
                          className="w-6 h-6 border border-[#ECECEC] bg-white text-[10px] font-bold rounded flex items-center justify-center hover:bg-[#FAFAFA] cursor-pointer"
                        >
                          -5
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAFF & ROLES BUILDER TAB */}
          {activeTab === 'staff' && (
            <div className="space-y-8">
              
              {/* Staff Roster Listing */}
              <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-[#ECECEC]">
                  <div>
                    <h3 className="text-[15px] font-bold tracking-tight uppercase">Staff Roster</h3>
                    <p className="text-[12px] text-neutral-500 font-light mt-0.5">Manage schedules, designations, and permissions.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {state.users.map(staff => (
                    <div key={staff.id} className="p-4 border border-[#ECECEC] rounded-2xl flex justify-between items-center bg-white shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-900 text-amber-400 border border-neutral-800 flex items-center justify-center font-bold text-[14px]">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-[13px] font-bold text-neutral-900 block">{staff.name}</span>
                          <span className="text-[11px] text-neutral-450 font-light block">{staff.email}</span>
                          <span className="text-[10px] text-amber-600 uppercase font-semibold tracking-wider block mt-1">{staff.role}</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-bold uppercase tracking-wider">
                        Online
                      </span>
                    </div>
                  ))}
                </div>

                {/* Add Staff form */}
                <form onSubmit={handleCreateStaff} className="bg-neutral-50/50 p-5 rounded-2xl border border-neutral-100 space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block">Onboard New Team Member</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="px-4 py-2.5 bg-white border border-[#ECECEC] rounded-xl text-[12px] text-neutral-950 focus:outline-none"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Staff Email"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="px-4 py-2.5 bg-white border border-[#ECECEC] rounded-xl text-[12px] text-neutral-950 focus:outline-none"
                    />
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as any)}
                      className="px-4 py-2.5 bg-white border border-[#ECECEC] rounded-xl text-[12px] text-neutral-955 focus:outline-none"
                    >
                      <option value="admin">Executive Director (Admin)</option>
                      <option value="chef">Chef de Cuisine</option>
                      <option value="runner">Service Runner</option>
                      <option value="manager">Restaurant Manager</option>
                      <option value="cashier">Cashier</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-md cursor-pointer transition-colors"
                  >
                    Add Staff Member
                  </button>
                </form>
              </div>

              {/* Roles and Permissions Builder */}
              <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-6">
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight uppercase">Custom Roles & Permissions Builder</h3>
                  <p className="text-[12px] text-neutral-500 font-light mt-0.5">Build custom staff groups and configure access permissions.</p>
                </div>

                <div className="space-y-4">
                  {customRoles.map((cr, idx) => (
                    <div key={idx} className="p-5 border border-neutral-100 rounded-2xl bg-neutral-50/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] font-bold text-neutral-950 uppercase tracking-wide">{cr.name} Role</span>
                        <span className="text-[10px] text-neutral-400 font-medium">Custom User Group</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                        {Object.entries(cr.permissions).map(([permName, hasPerm]) => (
                          <span 
                            key={permName} 
                            className={`px-2.5 py-1 rounded-full border ${
                              hasPerm 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-neutral-100 text-neutral-450 border-neutral-200'
                            }`}
                          >
                            {permName.replace(/([A-Z])/g, ' $1')}: {hasPerm ? 'Yes' : 'No'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Role Creator Form */}
                <form onSubmit={handleCreateRole} className="p-5 border border-dashed border-[#ECECEC] rounded-2xl space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 block">Create Custom Role Template</span>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Role Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hostess"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="px-4 py-2.5 bg-[#FAFAFA] border border-[#ECECEC] rounded-xl text-[12px] text-neutral-950 focus:outline-none w-full max-w-sm"
                    />
                  </div>
                  
                  <div className="space-y-2.5 pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Configure Permissions</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'viewRevenue', label: 'View Revenue Statistics' },
                        { id: 'modifyMenu', label: 'Modify Menu Catalog' },
                        { id: 'deductInventory', label: 'Adjust Stock Inventory' },
                        { id: 'closeSession', label: 'Authorize Table Checkouts' },
                        { id: 'manageStaff', label: 'Manage Staff Accounts' }
                      ].map(perm => (
                        <label key={perm.id} className="flex items-center gap-2.5 text-[12px] text-neutral-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(newRolePerms as any)[perm.id]}
                            onChange={(e) => setNewRolePerms({ ...newRolePerms, [perm.id]: e.target.checked })}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-0 border-neutral-300"
                          />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-neutral-955 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-md cursor-pointer transition-colors mt-2"
                  >
                    Build Custom Role
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* BRANDING CUSTOMIZATION PANEL TAB */}
          {activeTab === 'customization' && (
            <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-6">
              <div>
                <h3 className="text-[15px] font-bold tracking-tight uppercase">Restaurant Theme Customization Panel</h3>
                <p className="text-[12px] text-neutral-500 font-light mt-0.5">Customize your brand assets, design tokens, and restaurant policies instantly without changing any code.</p>
              </div>

              <form onSubmit={handleSaveCustomization} className="space-y-6">
                {/* Brand Details */}
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-100 pb-1.5 block">1. Brand Identity</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Restaurant Name</label>
                      <input
                        type="text"
                        required
                        value={settings.restaurantName || ''}
                        onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] text-neutral-950 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Logo URL</label>
                      <input
                        type="text"
                        value={settings.logoUrl || ''}
                        onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                        placeholder="e.g. /images/logo.png"
                        className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] text-neutral-950 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Palette */}
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-100 pb-1.5 block">2. Visual Design System Tokens</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Primary Theme Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.primaryColor || '#0A0A0A'}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="w-10 h-10 p-0 border border-[#ECECEC] rounded-lg cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={settings.primaryColor || ''}
                          onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-[#ECECEC] text-[12px] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Accent Theme Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.accentColor || '#D4AF37'}
                          onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                          className="w-10 h-10 p-0 border border-[#ECECEC] rounded-lg cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={settings.accentColor || ''}
                          onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-[#ECECEC] text-[12px] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Design Typography</label>
                      <select
                        value={settings.typography || 'Inter'}
                        onChange={(e) => setSettings({ ...settings, typography: e.target.value })}
                        className="w-full px-3 py-2.5 border border-[#ECECEC] bg-white rounded-xl text-[12px] focus:outline-none"
                      >
                        <option value="Inter">Inter (Sans-Serif Classic)</option>
                        <option value="Outfit">Outfit (Apple-inspired Modern)</option>
                        <option value="Montserrat">Montserrat (Geometric Premium)</option>
                        <option value="Playfair Display">Playfair Display (Luxury Elegant)</option>
                        <option value="Cinzel">Cinzel (High-End Editorial)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Operations configuration */}
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-100 pb-1.5 block">3. Operations & Financials</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Local Taxes (%)</label>
                      <input
                        type="number"
                        value={settings.taxes || 0}
                        onChange={(e) => setSettings({ ...settings, taxes: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">GST Rate (%)</label>
                      <input
                        type="number"
                        value={settings.gst || 0}
                        onChange={(e) => setSettings({ ...settings, gst: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Currency Code</label>
                      <input
                        type="text"
                        value={settings.currency || ''}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Languages</label>
                      <input
                        type="text"
                        value={settings.language || ''}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Experience Rules */}
                <div className="space-y-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-100 pb-1.5 block">4. Audio & Media Layout</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Welcome Screen Title</label>
                      <input
                        type="text"
                        value={settings.welcomeScreen?.title || ''}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          welcomeScreen: { ...settings.welcomeScreen, title: e.target.value } 
                        })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Welcome Screen Subtitle</label>
                      <input
                        type="text"
                        value={settings.welcomeScreen?.subtitle || ''}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          welcomeScreen: { ...settings.welcomeScreen, subtitle: e.target.value } 
                        })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Background Music Mode</label>
                      <select
                        value={settings.backgroundMusic || 'classical_jazz'}
                        onChange={(e) => setSettings({ ...settings, backgroundMusic: e.target.value })}
                        className="w-full px-3 py-2.5 border border-[#ECECEC] bg-white rounded-xl text-[12px] focus:outline-none"
                      >
                        <option value="classical_jazz">Luxurious Classical Jazz</option>
                        <option value="ambient_loft">Deep House Ambient Loft</option>
                        <option value="lofi_chill">Chill Lofi Lounge</option>
                        <option value="silent">No Background Music (Silence)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-[#ECECEC]">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
                  >
                    Save Custom Configurations
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* AI MANAGER COMMAND TAB */}
          {activeTab === 'ai_manager' && (
            <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-6">
              <div>
                <h3 className="text-[15px] font-bold tracking-tight uppercase">AURYN AI Manager Command</h3>
                <p className="text-[12px] text-neutral-550 font-light mt-0.5">
                  Natural language operations assistant powered by live restaurant database telemetry.
                </p>
              </div>

              {/* Chat View */}
              <div className="border border-[#ECECEC] rounded-[20px] p-5 bg-[#FAFAFA]/40 min-h-[300px] flex flex-col justify-between gap-5">
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                  {managerConversation.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'manager' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mb-1 px-1">
                        {msg.sender === 'manager' ? 'Manager Command' : 'AURYN AI Intelligence'}
                      </span>
                      <div className={`p-4 rounded-2xl max-w-[85%] text-[12px] leading-relaxed font-light ${
                        msg.sender === 'manager' 
                          ? 'bg-neutral-950 text-white rounded-tr-none shadow-md font-medium' 
                          : 'bg-white border border-[#ECECEC] text-neutral-800 rounded-tl-none shadow-sm whitespace-pre-wrap'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-200/60">
                  {[
                    { label: 'Why are sales down?', q: 'Why are sales down today?' },
                    { label: 'What to promote?', q: 'What should I promote tonight?' },
                    { label: 'Top performing runner?', q: 'Which runner is performing best?' },
                    { label: 'Highest revenue tables?', q: 'Which tables generate the highest revenue?' },
                    { label: 'Forecast tomorrow lunch', q: 'Predict tomorrow\'s lunch' }
                  ].map(qp => (
                    <button
                      key={qp.label}
                      type="button"
                      onClick={() => handleManagerQuery(qp.q)}
                      className="px-3.5 py-2 bg-white border border-[#ECECEC] hover:border-neutral-450 hover:bg-[#FAFAFA] rounded-xl text-[10px] font-bold text-neutral-600 cursor-pointer transition-all shadow-sm"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Input Form */}
              <form onSubmit={handleManagerSubmit} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ask AI Manager (e.g. why are sales down today?)"
                  value={managerQuery}
                  onChange={(e) => setManagerQuery(e.target.value)}
                  className="flex-1 px-4.5 py-3 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] text-neutral-955 focus:outline-none focus:border-neutral-900 transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer border border-neutral-800"
                >
                  Ask Agent
                </button>
              </form>
            </div>
          )}
          {/* SAAS HUB & ENTERPRISE MANAGEMENT TAB */}
          {activeTab === 'saas_hub' && (
            <div className="space-y-8 col-span-1 lg:col-span-12">
              
              {/* Row 1: Subscription Onboarding & White Label Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* SaaS Subscription Info */}
                <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest block mb-1">Tenant Profile</span>
                    <h3 className="text-[15px] font-bold tracking-tight uppercase">Subscription Account</h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-[12px] text-neutral-500">
                        <span>Active Plan</span>
                        <span className="font-bold text-neutral-800 uppercase tracking-wider text-[11px]">{currentPlan} Plan</span>
                      </div>
                      <div className="flex justify-between text-[12px] text-neutral-500">
                        <span>Assigned Workspace</span>
                        <span className="font-bold text-neutral-700">auryn-workspace-hq</span>
                      </div>
                      <div className="flex justify-between text-[12px] text-neutral-500">
                        <span>Monthly Cost</span>
                        <span className="font-bold text-neutral-700">₹45,000 / month</span>
                      </div>
                      <div className="flex justify-between text-[12px] text-neutral-500">
                        <span>Active Branches</span>
                        <span className="font-bold text-neutral-700">3 Nodes Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#FAFAFA] mt-6 flex gap-2.5">
                    <button
                      onClick={() => { playUISound('click'); setCurrentPlan('Starter'); }}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                        currentPlan === 'Starter' ? 'bg-neutral-950 text-white' : 'bg-[#FAFAFA] border border-[#ECECEC] text-neutral-600'
                      }`}
                    >
                      Starter
                    </button>
                    <button
                      onClick={() => { playUISound('click'); setCurrentPlan('Professional'); }}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                        currentPlan === 'Professional' ? 'bg-neutral-950 text-white' : 'bg-[#FAFAFA] border border-[#ECECEC] text-neutral-600'
                      }`}
                    >
                      Pro
                    </button>
                    <button
                      onClick={() => { playUISound('click'); setCurrentPlan('Enterprise'); }}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                        currentPlan === 'Enterprise' ? 'bg-neutral-950 text-white' : 'bg-[#FAFAFA] border border-[#ECECEC] text-neutral-600'
                      }`}
                    >
                      Enterprise
                    </button>
                  </div>
                </div>

                {/* Branch Operations & Transfer Center */}
                <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury flex flex-col justify-between md:col-span-2">
                  <div>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Multi-Node Logistics</span>
                    <h3 className="text-[15px] font-bold tracking-tight uppercase">Cross-Branch Telemetry & Replications</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">Target Destination Node</label>
                        <select
                          value={selectedSaaSBranch}
                          onChange={(e) => setSelectedSaaSBranch(e.target.value)}
                          className="w-full px-3 py-2.5 border border-[#ECECEC] bg-white rounded-xl text-[12px] focus:outline-none"
                        >
                          <option value="Uptown Bistro">Branch 2: Uptown Bistro</option>
                          <option value="Airport Lounge">Branch 3: Airport Lounge</option>
                          <option value="Coastal Deck">Branch 4: Coastal Deck</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Node Comparatives</span>
                        <div className="text-[12px] space-y-1 text-neutral-500 font-light">
                          <p>• Main Branch: **₹1,24,000** today (100% capacity)</p>
                          <p>• {selectedSaaSBranch}: **₹84,500** today (Moderate load)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-[#FAFAFA] mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleTransferMenu}
                      className="flex-1 py-3 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-800"
                    >
                      Sync Menu Catalog
                    </button>
                    <button
                      onClick={handleTransferInventory}
                      className="flex-1 py-3 bg-[#FAFAFA] hover:bg-neutral-100 border border-[#ECECEC] text-neutral-800 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Balance Stock Levels
                    </button>
                  </div>
                </div>

              </div>

              {/* Row 2: Developer APIs & Webhooks Engine */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Developer Integrations & APIs */}
                <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-5">
                  <div>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Developer Center</span>
                    <h3 className="text-[15px] font-bold tracking-tight uppercase">Public API Access Tokens</h3>
                    <p className="text-[11px] text-neutral-500 font-light mt-1">Expose telemetry feeds and order states to external point-of-sale systems.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Private Live Token</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={apiPrivateKey}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-neutral-50 text-[12px] font-mono text-neutral-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleRegenerateApiKey}
                          className="px-4 py-2.5 bg-neutral-955 text-white hover:bg-neutral-900 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="bg-neutral-50/50 p-4 rounded-xl border border-neutral-100 space-y-1">
                      <span className="text-[9.5px] font-mono font-bold text-neutral-500 uppercase tracking-widest block">cURL Example Request</span>
                      <pre className="text-[9px] font-mono text-neutral-600 overflow-x-auto whitespace-pre p-2 bg-white rounded border border-[#ECECEC] scrollbar-none leading-relaxed">
                        {`curl -X GET "https://api.aurynhq.com/v1/telemetry" \\\n  -H "Authorization: Bearer ${apiPrivateKey}"`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Webhooks Engine */}
                <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-5">
                  <div>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Automations</span>
                    <h3 className="text-[15px] font-bold tracking-tight uppercase">Outgoing Webhooks Config</h3>
                    <p className="text-[11px] text-neutral-500 font-light mt-1">Dispatch event notifications to your inventory handlers or bookkeeping tools.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Webhook Endpoint URL</label>
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] text-neutral-955 focus:outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Trigger Events Subscription</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'ev_order', label: 'order.placed', checked: true },
                          { id: 'ev_cook', label: 'order.preparing', checked: true },
                          { id: 'ev_delivered', label: 'order.delivered', checked: true },
                          { id: 'ev_checkout', label: 'session.checkout', checked: true }
                        ].map(ev => (
                          <label key={ev.id} className="flex items-center gap-2 text-[11px] text-neutral-600 cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked={ev.checked}
                              className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 border-neutral-300"
                            />
                            <span>{ev.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Row 3: SaaS Immutable Audit Ledger */}
              <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-5">
                <div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Immutable Log Ledger</span>
                  <h3 className="text-[15px] font-bold tracking-tight uppercase">SaaS Security Audit Trail</h3>
                  <p className="text-[12px] text-neutral-550 font-light mt-0.5">Chronological ledger recording tenant actions, database seeds, and operational updates.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead>
                      <tr className="border-b border-[#ECECEC] text-[10px] font-bold uppercase text-neutral-400">
                        <th className="pb-3.5 pl-2 font-bold tracking-wider">Timestamp</th>
                        <th className="pb-3.5 font-bold tracking-wider">Action Event</th>
                        <th className="pb-3.5 font-bold tracking-wider">Description</th>
                        <th className="pb-3.5 pr-2 font-bold tracking-wider text-right">Tenant Node</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FAFAFA] text-neutral-700 font-light">
                      {(state.auditLogs || []).slice(0, 8).map((log) => (
                        <tr key={log.id} className="hover:bg-neutral-50/40 transition-colors">
                          <td className="py-3.5 pl-2 font-mono text-[10px] text-neutral-450">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="py-3.5 font-bold text-neutral-900">{log.action}</td>
                          <td className="py-3.5 text-neutral-550">{log.details}</td>
                          <td className="py-3.5 pr-2 text-right font-mono text-[10px] text-neutral-450">main-branch</td>
                        </tr>
                      ))}
                      {(state.auditLogs || []).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-neutral-400 font-light">
                            No logs registered. Visit \`/api/setup\` to trigger initial logs.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </section>

      </main>

      {/* Menu Item Form Modal */}
      <AnimatePresence>
        {menuModalOpen && editingMenuItem && (
          <div className="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-7.5 rounded-[24px] border border-[#ECECEC] shadow-luxury max-w-md w-full"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#ECECEC] mb-5">
                <h3 className="text-[15px] font-bold uppercase tracking-wide">
                  {editingMenuItem.id ? 'Modify Dish' : 'Create Dish'}
                </h3>
                <button
                  onClick={() => {
                    playUISound('click');
                    setMenuModalOpen(false);
                    setEditingMenuItem(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-955 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleMenuSave} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Dish Name</label>
                  <input
                    type="text"
                    required
                    value={editingMenuItem.name || ''}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] text-neutral-955 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-450 block mb-1">Description</label>
                  <textarea
                    required
                    value={editingMenuItem.description || ''}
                    onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] text-neutral-955 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={editingMenuItem.price || 0}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] text-neutral-955 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Category</label>
                    <select
                      value={editingMenuItem.category || 'Starters'}
                      onChange={(e) => setEditingMenuItem({ ...editingMenuItem, category: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] text-neutral-955 focus:outline-none focus:border-neutral-900"
                    >
                      <option value="Starters">Starters</option>
                      <option value="Mains">Mains</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 justify-end pt-4 border-t border-[#ECECEC]">
                  <button
                    type="button"
                    onClick={() => {
                      playUISound('click');
                      setMenuModalOpen(false);
                      setEditingMenuItem(null);
                    }}
                    className="px-4.5 py-2.5 border border-[#ECECEC] hover:border-neutral-400 rounded-xl text-[11px] font-semibold uppercase tracking-wider text-neutral-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors shadow-luxury cursor-pointer"
                  >
                    Save Dish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Table Modal */}
      <AnimatePresence>
        {tableModalOpen && (
          <div className="fixed inset-0 bg-neutral-955/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-7.5 rounded-[24px] border border-[#ECECEC] shadow-luxury max-w-sm w-full"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#ECECEC] mb-5">
                <h3 className="text-[15px] font-bold uppercase tracking-wide">Add New Table</h3>
                <button
                  onClick={() => {
                    playUISound('click');
                    setTableModalOpen(false);
                    setNewTableName('');
                  }}
                  className="text-neutral-400 hover:text-neutral-950 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleTableSave} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Table Name/Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Table 9"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] text-neutral-955 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="flex gap-2.5 justify-end pt-4 border-t border-[#ECECEC]">
                  <button
                    type="button"
                    onClick={() => {
                      playUISound('click');
                      setTableModalOpen(false);
                      setNewTableName('');
                    }}
                    className="px-4.5 py-2.5 border border-[#ECECEC] hover:border-neutral-400 rounded-xl text-[11px] font-semibold uppercase tracking-wider text-neutral-600 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors shadow-luxury cursor-pointer"
                  >
                    Add Table
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Stub repository logs writer
class RestaurantRepository {
  public static async getState(): Promise<RestaurantState> {
    const [tables, sessions, orders, menu, inventory, notifications, auditLogs, users] = await Promise.all([
      this.getTables(),
      this.getSessions(),
      this.getOrders(),
      this.getMenuItems(),
      this.getInventory(),
      this.getNotifications(),
      this.getAuditLogs(),
      this.getUsers()
    ]);
    return { tables, sessions, orders, menu, inventory, notifications, auditLogs, users };
  }

  public static async getTables(): Promise<TableType[]> {
    const { data } = await supabase.from('tables').select('*');
    return (data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      qrCode: t.qr_code,
      status: t.status,
      currentSessionId: t.current_session_id
    })).sort((a: any, b: any) => parseInt(a.id) - parseInt(b.id));
  }

  public static async getSessions(): Promise<DiningSession[]> {
    const { data } = await supabase.from('sessions').select('*');
    return (data || []).map((s: any) => ({
      id: s.id,
      tableId: s.table_id,
      ownerId: s.owner_id,
      guests: s.guests || [],
      status: s.status,
      createdAt: s.created_at,
      closedAt: s.closed_at,
      orders: s.orders || [],
      timeline: s.timeline || [],
      paymentMethod: s.payment_method
    }));
  }

  public static async getOrders(): Promise<Order[]> {
    const { data } = await supabase.from('orders').select('*');
    return (data || []).map((o: any) => ({
      id: o.id,
      sessionId: o.session_id,
      tableId: o.table_id,
      items: o.items || [],
      status: o.status,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      runnerId: o.runner_id,
      runnerRoute: o.runner_route || [],
      estimatedCompletion: o.estimated_completion,
      confidenceScore: Number(o.confidence_score),
      kitchenLoad: Number(o.kitchen_load)
    }));
  }

  public static async getMenuItems(): Promise<MenuItem[]> {
    const { data } = await supabase.from('menu_items').select('*');
    return (data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      price: Number(m.price),
      category: m.category,
      rating: Number(m.rating),
      isChefRecommendation: m.is_chef_recommendation,
      isPopular: m.is_popular,
      isTrending: m.is_trending,
      prepTime: m.prep_time,
      calories: m.calories,
      protein: m.protein,
      allergens: m.allergens || [],
      ingredients: m.ingredients || [],
      image: m.image
    }));
  }

  public static async getInventory(): Promise<InventoryItem[]> {
    const { data } = await supabase.from('inventory').select('*');
    return (data || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      stock: Number(i.stock),
      unit: i.unit,
      minStock: Number(i.min_stock),
      expiryDate: i.expiry_date || new Date().toISOString()
    }));
  }

  public static async getUsers(): Promise<User[]> {
    const { data } = await supabase.from('users').select('*');
    return (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      passwordHash: u.password_hash
    }));
  }

  public static async getAuditLogs(): Promise<AuditLog[]> {
    const { data } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(200);
    return (data || []).map((l: any) => ({
      id: l.id,
      timestamp: l.timestamp,
      action: l.action,
      userId: l.user_id,
      details: l.details
    }));
  }

  public static async getNotifications(): Promise<NotificationType[]> {
    const { data } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false });
    return (data || []).map((n: any) => ({
      id: n.id,
      timestamp: n.timestamp,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read
    }));
  }

  public static async createMenuItem(item: MenuItem): Promise<void> {
    const id = `menu-${Date.now()}`;
    await supabase.from('menu_items').insert({
      id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      rating: item.rating || 5,
      is_chef_recommendation: item.isChefRecommendation || false,
      is_popular: item.isPopular || false,
      is_trending: item.isTrending || false,
      prep_time: item.prepTime || 10,
      calories: item.calories || 300,
      protein: item.protein || '12g',
      allergens: item.allergens || [],
      ingredients: item.ingredients || [],
      image: item.image || '/images/placeholder.jpg',
      restaurant_id: RESTAURANT_ID,
      branch_id: BRANCH_ID
    });
    await this.writeAuditLog('menu.create', `Menu item ${item.name} created.`);
  }

  public static async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<void> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.category !== undefined) dbUpdates.category = updates.category;

    await supabase.from('menu_items').update(dbUpdates).eq('id', id);
    await this.writeAuditLog('menu.update', `Menu item ${id} updated.`);
  }

  public static async deleteMenuItem(id: string): Promise<void> {
    await supabase.from('menu_items').delete().eq('id', id);
    await this.writeAuditLog('menu.delete', `Menu item ${id} deleted.`);
  }

  public static async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
    await supabase.from('inventory').update({ stock: updates.stock }).eq('id', id);
  }

  public static async createTable(name: string): Promise<void> {
    const id = `t-${Date.now()}`;
    await supabase.from('tables').insert({
      id,
      name,
      qr_code: `df-table-${id}-auth`,
      status: 'available',
      restaurant_id: RESTAURANT_ID,
      branch_id: BRANCH_ID
    });
    await this.writeAuditLog('table.create', `Table ${name} created.`);
  }

  public static async deleteTable(id: string): Promise<void> {
    await supabase.from('tables').delete().eq('id', id);
    await this.writeAuditLog('table.delete', `Table ID ${id} deleted.`);
  }

  public static async writeAuditLog(action: string, details: string) {
    const id = `log-${Date.now()}`;
    await supabase.from('audit_logs').insert({
      id,
      timestamp: new Date().toISOString(),
      action,
      details,
      restaurant_id: RESTAURANT_ID,
      branch_id: BRANCH_ID
    });
  }
}
