'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Clock, Award, CheckCircle2, DollarSign, ChevronRight, MessageSquare, AlertCircle, Bell, X, Lock, ShieldAlert, MapPin, ShoppingBag, Send
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { MenuItem, DiningSession, Order, Notification, Table } from '@/shared/types';
import { getDistanceInMeters, RESTAURANT_LAT, RESTAURANT_LON, ALLOWED_RADIUS_METERS } from '@/shared/lib/geo';
import { playUISound } from '@/shared/lib/sounds';
import PremiumReceipt from '@/shared/components/receipt';

export default function DiningExperience() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.id as string;

  // Local state
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [guestId, setGuestId] = useState('');
  const [joined, setJoined] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [session, setSession] = useState<DiningSession | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Starters' | 'Mains' | 'Desserts' | 'Beverages'>('All');
  const [activeAllergenFilter, setActiveAllergenFilter] = useState<string | null>(null);
  const [showBillRequest, setShowBillRequest] = useState(false);
  const [companionConsent, setCompanionConsent] = useState(true);
  const [companionLoaded, setCompanionLoaded] = useState(false);

  // Customizer styling state (fallback colors)
  const [themeColors, setThemeColors] = useState({
    name: 'Kings of Wings',
    primary: '#0B0C10',
    accent: '#FF5A09'
  });

  // Geolocation states
  const [geoStatus, setGeoStatus] = useState<'checking' | 'allowed' | 'denied' | 'out_of_range' | 'occupied_lock'>('checking');
  const [distance, setDistance] = useState(0);

  // Cart draft
  const [draftCart, setDraftCart] = useState<{ [menuItemId: string]: number }>({});
  
  // Realtime notification banners
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);

  // AI Concierge
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; action?: any; recommendations?: MenuItem[] }>>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiEndRef = useRef<HTMLDivElement>(null);

  // Geolocation Check on Mount
  const verifyLocation = () => {
    if (tableId.toLowerCase() === 'takeaway') {
      setGeoStatus('allowed');
      return;
    }

    if (localStorage.getItem('df_simulated_gps') === 'true') {
      setGeoStatus('allowed');
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoStatus('allowed');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = getDistanceInMeters(latitude, longitude, RESTAURANT_LAT, RESTAURANT_LON);
        setDistance(dist);
        if (dist <= ALLOWED_RADIUS_METERS) {
          setGeoStatus('allowed');
        } else {
          setGeoStatus('out_of_range');
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setGeoStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleSimulateGps = () => {
    localStorage.setItem('df_simulated_gps', 'true');
    setGeoStatus('allowed');
  };

  // Realtime data loaders
  useEffect(() => {
    verifyLocation();

    // Read guest info
    const savedName = localStorage.getItem('df_guest_name');
    const savedId = localStorage.getItem('df_guest_id');
    
    if (savedName && savedId) {
      setGuestName(savedName);
      setGuestId(savedId);
      setJoined(true);
      
      setAiMessages([
        {
          sender: 'ai',
          text: `Welcome back, ${savedName}. I am your Kings of Wings AI Concierge. Ask me for recommendations, pairings, or allergens.`
        }
      ]);
    }

    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
      if (data) {
        setThemeColors({
          name: data.restaurant_name || 'AURYN',
          primary: data.primary_color || '#0A0A0A',
          accent: data.accent_color || '#D4AF37'
        });
      }
    };

    const fetchMenu = async () => {
      const { data } = await supabase.from('menu_items').select('*');
      setMenu((data || []).map((m: any) => ({
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
      })));
    };

    const fetchTableSession = async () => {
      const { data: tData } = await supabase.from('tables').select('*').eq('id', tableId).maybeSingle();
      if (tData && tData.current_session_id) {
        const { data: sData } = await supabase.from('sessions').select('*').eq('id', tData.current_session_id).maybeSingle();
        if (sData) {
          const activeSession = {
            id: sData.id,
            tableId: sData.table_id,
            ownerId: sData.owner_id,
            guests: sData.guests || [],
            status: sData.status,
            createdAt: sData.created_at,
            closedAt: sData.closed_at,
            orders: sData.orders || [],
            timeline: sData.timeline || [],
            paymentMethod: sData.payment_method
          };
          setSession(activeSession as any);
          
          if (activeSession.status === 'completed') {
            playUISound('success');
            setShowReceipt(true);
          }
        } else {
          setSession(null);
          setJoined(false);
          localStorage.removeItem('df_guest_name');
          localStorage.removeItem('df_guest_id');
        }

        const { data: oData } = await supabase.from('orders').select('*').eq('session_id', tData.current_session_id);
        setOrders((oData || []).map((o: any) => ({
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
        })));
      } else {
        setSession(null);
        setOrders([]);
        setJoined(false);
        localStorage.removeItem('df_guest_name');
        localStorage.removeItem('df_guest_id');
      }
      setLoading(false);
    };

    fetchSettings();
    fetchMenu();
    fetchTableSession();

    // Subscribe to Supabase Realtime changes
    const channel = supabase.channel(`table-${tableId}-telemetry-sync`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        fetchSettings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchMenu();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
        fetchTableSession();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        fetchTableSession();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchTableSession();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const n = payload.new;
        if (n.message.includes(`Table ${tableId}`)) {
          playUISound('notification');
          triggerLiveAlert(n.title, n.message, n.type);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId]);

  useEffect(() => {
    if (aiOpen) {
      aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, aiOpen]);

  // Display slide-down premium alert banner
  const triggerLiveAlert = (title: string, message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: `local-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      title,
      message,
      type,
      read: false
    };
    setLocalNotifications(prev => [newNotif, ...prev]);
    setTimeout(() => {
      setLocalNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    playUISound('click');

    const newId = `guest-${Date.now()}`;
    localStorage.setItem('df_guest_name', guestName);
    localStorage.setItem('df_guest_id', newId);
    setGuestId(newId);

    try {
      const res = await fetch('/api/session/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, guestId: newId, guestName })
      });
      if (res.ok) {
        playUISound('success');
        setJoined(true);
        if (companionConsent) {
          setCompanionLoaded(true);
          setAiMessages([
            {
              sender: 'ai',
              text: `Welcome back, ${guestName}. Kings of Wings Companion AI has loaded your global profile:
• **Spice Preference**: Medium (Sweet-spicy honey garlic & buffalo)
• **Favorite Categories**: Gourmet Wings & Starters
• **Dietary/Allergies**: None

The Chef recommends starting with our crispy **Classic Buffalo Wings** (₹480) or refreshing with a **Blueberry Basil Lemonade** (₹260). How may I assist you today?`
            }
          ]);
        } else {
          setAiMessages([
            {
              sender: 'ai',
              text: `Good evening, ${guestName}. Welcome to **Kings of Wings**. I am your Specialized Restaurant Intelligence Concierge. I can recommend dishes based on your preferences, filter for allergens, or even add items directly to your table cart. What can I assist you with today?`
            }
          ]);
        }
      } else if (res.status === 403) {
        setGeoStatus('occupied_lock');
      }
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const addToDraft = (itemId: string) => {
    playUISound('click');
    setDraftCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromDraft = (itemId: string) => {
    playUISound('click');
    setDraftCart(prev => {
      const updated = { ...prev };
      if (updated[itemId] > 1) updated[itemId]--;
      else delete updated[itemId];
      return updated;
    });
  };

  const handlePlaceOrder = async () => {
    if (Object.keys(draftCart).length === 0 || !session) return;
    playUISound('click');

    const itemsPayload = Object.keys(draftCart).map(itemId => ({
      menuItemId: itemId,
      quantity: draftCart[itemId]
    }));

    try {
      const res = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, tableId, items: itemsPayload })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          const newOrders = data.orders.map((o: any) => ({
            id: o.id,
            sessionId: o.sessionId,
            tableId: o.tableId,
            items: o.items || [],
            status: o.status,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
            runnerId: o.runnerId,
            runnerRoute: o.runnerRoute || [],
            estimatedCompletion: o.estimatedCompletion,
            confidenceScore: Number(o.confidenceScore),
            kitchenLoad: Number(o.kitchenLoad)
          }));
          setOrders(prev => [...prev, ...newOrders]);
        } else if (data.order) {
          const o = data.order;
          const newOrder = {
            id: o.id,
            sessionId: o.sessionId,
            tableId: o.tableId,
            items: o.items || [],
            status: o.status,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
            runnerId: o.runnerId,
            runnerRoute: o.runnerRoute || [],
            estimatedCompletion: o.estimatedCompletion,
            confidenceScore: Number(o.confidenceScore),
            kitchenLoad: Number(o.kitchenLoad)
          };
          setOrders(prev => [...prev, newOrder]);
        }
        playUISound('success');
        setDraftCart({});
      }
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  // Payment triggers: Razorpay
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    if (!session) return;
    playUISound('click');
    
    const total = getGrandTotal();
    const res = await loadRazorpay();
    
    if (!res) {
      alert('Razorpay SDK failed to load. Please verify your connection.');
      return;
    }

    const options = {
      key: 'rzp_test_AURYNKey2026',
      amount: total * 100, // paise
      currency: 'INR',
      name: themeColors.name,
      description: `Billing Statement for Table ${tableId}`,
      handler: async function (response: any) {
        // Payment success callback
        // 1. Write Receipt to Supabase
        const receiptId = `rcpt-${Date.now()}`;
        await supabase.from('receipts').insert({
          id: receiptId,
          restaurant_id: 'auryn-hq',
          branch_id: 'main-branch',
          receipt_number: `AUR-${Date.now().toString().slice(-6)}`,
          session_id: session.id,
          table_id: tableId,
          items: orders.flatMap(o => o.items),
          payment_method: 'Razorpay',
          amount_paid: total,
          timestamp: new Date().toISOString(),
          gst: Math.round(total * 0.18),
          taxes: Math.round(total * 0.05)
        });

        // 2. Close active session
        await fetch('/api/session/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'close', sessionId: session.id })
        });
        
        playUISound('payment_success');
      },
      prefill: {
        name: guestName,
        email: `${guestId}@auryn.ai`
      },
      theme: {
        color: themeColors.accent
      }
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
  };

  // Cash payment request workflow
  const handleRequestCashPayment = async () => {
    if (!session) return;
    playUISound('click');

    try {
      const total = getGrandTotal();
      
      // Update session status & method in Supabase
      const updatedTimeline = [
        ...session.timeline,
        {
          timestamp: new Date().toISOString(),
          type: 'payment.requested_cash',
          description: `Table requested Cash Payment. Awaiting Food Runner verification.`
        }
      ];
      await supabase.from('sessions').update({
        status: 'payment_pending',
        payment_method: 'Cash',
        timeline: updatedTimeline
      }).eq('id', session.id);

      // Write notification in Supabase
      const notifId = `n-cash-${Date.now()}`;
      await supabase.from('notifications').insert({
        id: notifId,
        timestamp: new Date().toISOString(),
        title: 'Cash Collection Requested',
        message: `Table ${tableId} is requesting cash payment of ₹${total}.`,
        type: 'warning',
        read: false,
        restaurant_id: 'auryn-hq',
        branch_id: 'main-branch'
      });

      // Update table status in Supabase
      await supabase.from('tables').update({
        status: 'payment_pending'
      }).eq('id', tableId);

      playUISound('success');
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const sendRunnerAlert = async (alertType: string, msg: string) => {
    playUISound('click');
    try {
      const notifId = `n-alert-${Date.now()}`;
      await supabase.from('notifications').insert({
        id: notifId,
        timestamp: new Date().toISOString(),
        title: alertType,
        message: msg,
        type: 'info',
        read: false,
        restaurant_id: 'auryn-hq',
        branch_id: 'main-branch'
      });

      if (session) {
        const updatedTimeline = [
          ...session.timeline,
          {
            timestamp: new Date().toISOString(),
            type: 'runner.request',
            description: `${alertType} request sent: ${msg}`
          }
        ];
        await supabase.from('sessions').update({
          timeline: updatedTimeline
        }).eq('id', session.id);
      }

      playUISound('success');
      alert(`${alertType} request registered. A runner is dispatched.`);
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const handleAiSend = async (customQuery?: string) => {
    const queryToSend = customQuery || aiQuery;
    if (!queryToSend.trim() || !session) return;

    if (!customQuery) setAiQuery('');

    setAiMessages(prev => [...prev, { sender: 'user', text: queryToSend }]);
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryToSend,
          sessionId: session.id,
          guestName,
          context: { weather: 'Pleasant', time: 'Evening' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.suggestedAction && data.suggestedAction.type === 'filter_menu') {
          setActiveAllergenFilter(data.suggestedAction.payload.allergenFilter);
        }

        setAiMessages(prev => [
          ...prev, 
          { 
            sender: 'ai', 
            text: data.message,
            recommendations: data.recommendations,
            action: data.suggestedAction
          }
        ]);
        playUISound('notification');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApproveAiOrder = async (action: any) => {
    if (!session || !action.payload) return;
    playUISound('click');

    try {
      const res = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          tableId,
          items: [{ menuItemId: action.payload.menuItemId, quantity: action.payload.quantity }]
        })
      });
      if (res.ok) {
        playUISound('success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getDraftTotal = () => {
    return Object.keys(draftCart).reduce((sum, itemId) => {
      const item = menu.find(m => m.id === itemId);
      return sum + (item?.price || 0) * draftCart[itemId];
    }, 0);
  };

  const getPlacedTotal = () => {
    return orders.reduce((sum, order) => {
      return sum + order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }, 0);
  };

  const getGrandTotal = () => getDraftTotal() + getPlacedTotal();

  const isSessionOwner = session && session.ownerId === guestId;
  const allOrdersDelivered = orders.length > 0 && orders.every(o => o.status === 'delivered');

  const getDiningStage = (): 'Arrival' | 'Ordering' | 'Waiting' | 'Dining' | 'Leaving' => {
    if (!session) return 'Arrival';
    if (session.status === 'completed') return 'Leaving';
    if (session.status === 'payment_pending' || showBillRequest) return 'Leaving';
    const activeOrders = orders.filter(o => o.status !== 'delivered');
    if (orders.length > 0 && activeOrders.length === 0) return 'Dining';
    if (orders.length > 0 && activeOrders.length > 0) return 'Waiting';
    if (Object.keys(draftCart).length > 0) return 'Ordering';
    return 'Arrival';
  };

  const diningStage = getDiningStage();

  // SKELETON SCREEN FOR LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-white">
        <Sparkles className="w-8 h-8 text-amber-500 animate-spin mb-4" />
        <span className="text-[12px] tracking-[0.2em] font-semibold text-neutral-400 uppercase">Synchronizing Dining Node...</span>
      </div>
    );
  }

  // GEOLOCATION SECURITY BLOCKS
  if (geoStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-6 text-center">
        <Clock className="w-10 h-10 text-neutral-450 animate-pulse mb-4" />
        <h3 className="text-md font-bold uppercase tracking-wider text-neutral-900">Validating Geo-Fence Boundaries</h3>
        <p className="text-[12px] text-neutral-500 mt-1 max-w-xs font-light">Confirming your device lies within the operational geofence range of the restaurant.</p>
      </div>
    );
  }

  if (geoStatus === 'out_of_range' || geoStatus === 'denied') {
    return (
      <main className="min-h-screen bg-rose-50/10 flex flex-col justify-center items-center p-6 text-center">
        <div className="w-14 h-14 bg-white border border-rose-100 rounded-2xl flex items-center justify-center shadow-lg mb-6">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
        </div>
        <h1 className="text-lg font-bold text-neutral-955 tracking-tight">Geo-Fence Boundary Breach</h1>
        <p className="mt-2 text-[12px] text-neutral-500 max-w-sm font-light leading-relaxed">
          Operational permissions restricted. Customer dining consoles can only be accessed while located inside the restaurant radius (50 meters).
        </p>
        <button 
          onClick={handleSimulateGps}
          className="mt-6 px-5 py-2.5 bg-neutral-955 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-md hover:bg-neutral-900 cursor-pointer"
        >
          Activate Simulator Override GPS
        </button>
      </main>
    );
  }

  if (geoStatus === 'occupied_lock') {
    return (
      <main className="min-h-screen bg-amber-50/10 flex flex-col justify-center items-center p-6 text-center">
        <div className="w-14 h-14 bg-white border border-amber-100 rounded-2xl flex items-center justify-center shadow-lg mb-6">
          <Lock className="w-6 h-6 text-amber-500" />
        </div>
        <h1 className="text-lg font-bold text-neutral-955 tracking-tight">Table Occupancy Lock Active</h1>
        <p className="mt-2 text-[12px] text-neutral-500 max-w-sm font-light leading-relaxed">
          This table is currently occupied by an active dining session. Please scan an available table or contact staff.
        </p>
      </main>
    );
  }

  // 1. ONBOARDING LOGIN SCREEN (Not Joined Yet)
  if (!joined) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center p-6 selection:bg-neutral-800 text-white relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[25%] left-[25%] w-64 h-64 rounded-full bg-amber-500/20 blur-[100px]" />
        </div>

        <div className="mb-8 flex flex-col items-center">
          <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center shadow-2xl">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-[14px] font-bold text-neutral-400 uppercase tracking-[0.25em] mt-5">{themeColors.name}</h2>
          <span className="text-[9px] font-bold text-amber-505 uppercase tracking-widest mt-1">Table {tableId} Initialize</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-neutral-900/60 border border-neutral-800/80 p-8 rounded-[28px] shadow-2xl backdrop-blur-xl"
        >
          <form onSubmit={handleOnboardingSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5 pl-0.5">Guest Nickname</label>
              <input
                type="text"
                required
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-950/70 text-[13px] text-white placeholder:text-neutral-505 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="companionConsent"
                checked={companionConsent}
                onChange={(e) => setCompanionConsent(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-neutral-950 border-neutral-800 focus:ring-0 mt-0.5 cursor-pointer"
              />
              <label htmlFor="companionConsent" className="text-[10px] text-neutral-400 font-light leading-relaxed cursor-pointer select-none">
                Enable <b>Kings of Wings Companion AI</b> to remember my dining preferences (allergies, spice level, favorite dishes) across all partner venues.
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-white text-black hover:bg-neutral-100 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            >
              Initialize Table Session
            </button>
          </form>
        </motion.div>
      </main>
    );
  }

  // 2. MAIN CUSTOMER DINING DASHBOARD
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 pb-16 selection:bg-neutral-200">
      
      {/* Sliding Alerts Banners */}
      <div className="fixed top-6 right-6 z-50 space-y-3 w-80">
        <AnimatePresence>
          {localNotifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="bg-neutral-900 border border-neutral-800 text-white p-4.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.25)] flex items-start gap-3 backdrop-blur-md"
            >
              <Bell className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[12px] font-bold tracking-tight">{notif.title}</h4>
                <p className="text-[11px] text-neutral-400 font-light mt-0.5 leading-normal">{notif.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Header Deck */}
      <header className="bg-[#0A0A0A] text-white border-b border-neutral-900 px-6 md:px-12 py-5 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center shadow-lg">
            <Sparkles className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-[13px] font-bold uppercase tracking-[0.2em]">{themeColors.name}</h1>
            <span className="text-[9px] text-neutral-400 font-medium block uppercase tracking-wider">{tableId.toLowerCase() === 'takeaway' ? 'Takeaway Mode' : `Table ${tableId}`}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full text-[9px] text-emerald-400 font-bold tracking-widest cursor-help" title="Kings of Wings Secure QR Code & Geofence Verified">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>SECURE NODE</span>
          </div>
          <span className="hidden sm:inline">Active Guest: {guestName}</span>
        </div>
      </header>

      {/* Journey Tracker Stepper */}
      <div className="bg-white border-b border-[#ECECEC] py-3.5 px-6 md:px-12 flex justify-center">
        <div className="flex items-center justify-between w-full max-w-xl text-[9px] font-bold uppercase tracking-wider text-neutral-400">
          {(tableId.toLowerCase() === 'takeaway' ? [
            { id: 'Arrival', label: 'Cart' },
            { id: 'Ordering', label: 'Cooking' },
            { id: 'Waiting', label: 'QC Check' },
            { id: 'Dining', label: 'Dispatch' },
            { id: 'Leaving', label: 'Complete' }
          ] : [
            { id: 'Arrival', label: 'Arrival' },
            { id: 'Ordering', label: 'Ordering' },
            { id: 'Waiting', label: 'Waiting' },
            { id: 'Dining', label: 'Savoring' },
            { id: 'Leaving', label: 'Departure' }
          ]).map((stage, idx, arr) => {
            const isCurrent = diningStage === stage.id;
            return (
              <React.Fragment key={stage.id}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                    isCurrent 
                      ? 'bg-neutral-955 border-neutral-955 text-white shadow-md' 
                      : 'bg-[#FAFAFA] border-[#ECECEC] text-neutral-350'
                  }`} />
                  <span className={isCurrent ? 'text-neutral-950 font-bold' : ''}>{stage.label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div className="flex-1 h-[1px] bg-[#ECECEC] mx-3 max-w-[40px]" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {session && (
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-8">
          
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Menu Cards Catalog (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Category Filter Cards */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {(['All', 'Starters', 'Mains', 'Desserts', 'Beverages'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      playUISound('click');
                      setSelectedCategory(cat);
                    }}
                    className={`px-4.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat 
                        ? 'bg-neutral-950 text-white shadow-md' 
                        : 'bg-white border border-[#ECECEC] text-neutral-500 hover:text-neutral-950'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu catalog cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {menu
                  .filter(m => selectedCategory === 'All' || m.category === selectedCategory)
                  .map(item => (
                    <motion.div
                      layoutId={`item-${item.id}`}
                      key={item.id}
                      className="bg-white border border-[#ECECEC] rounded-[24px] overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group"
                    >
                      <div className="h-44 bg-[#F5F5F5] relative overflow-hidden">
                        <img 
                          src={`https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400`} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                        {item.isChefRecommendation && (
                          <span className="absolute top-4 left-4 px-2.5 py-1 bg-neutral-900/90 text-white backdrop-blur-md rounded-full text-[9px] font-bold uppercase tracking-wider border border-neutral-800">
                            Chef Specials
                          </span>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-baseline gap-2">
                            <h3 className="text-[14px] font-bold text-neutral-955">{item.name}</h3>
                            <span className="text-[13px] font-bold text-neutral-900 shrink-0">₹{item.price}</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 font-light mt-1.5 leading-relaxed">{item.description}</p>
                          <div className="flex gap-2.5 text-[9px] text-neutral-450 font-bold uppercase tracking-wide mt-3.5">
                            <span>Rating {item.rating}★</span>
                            <span>{item.prepTime} Min</span>
                            <span>{item.calories} kCal</span>
                          </div>
                        </div>

                        <div className="flex justify-end mt-4 pt-3 border-t border-[#FAFAFA]">
                          {draftCart[item.id] ? (
                            <div className="flex items-center bg-neutral-950 text-white rounded-full p-1 border border-[#ECECEC]">
                              <button 
                                onClick={() => removeFromDraft(item.id)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-neutral-850 rounded-full font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-3 text-[11px] font-bold">{draftCart[item.id]}</span>
                              <button 
                                onClick={() => addToDraft(item.id)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-neutral-850 rounded-full font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToDraft(item.id)}
                              className="px-4 py-2 border border-[#ECECEC] hover:border-neutral-450 hover:bg-[#FAFAFA] rounded-full text-[10px] font-bold uppercase tracking-wider text-neutral-700 transition-all cursor-pointer"
                            >
                              Add to Order
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>

            </div>

            {/* Right Column: Shared Table Cart & Timeline (5 cols) */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Cart Container */}
              {/* Cart / Dining Mode Container */}
              {allOrdersDelivered && !showBillRequest && Object.keys(draftCart).length === 0 ? (
                <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury space-y-6 relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-gradient-to-tr from-amber-500/20 to-transparent" />
                  
                  <div className="text-center py-4 space-y-2">
                    <div className="w-12 h-12 bg-neutral-950 rounded-2xl flex items-center justify-center mx-auto shadow-lg border border-neutral-800">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-[18px] font-bold tracking-tight text-neutral-900 mt-3">Enjoy your meal!</h3>
                    <p className="text-[12px] text-neutral-400 font-light max-w-xs mx-auto">
                      All your dishes have been served. Kings of Wings is at your service.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        playUISound('click');
                        setSelectedCategory('All');
                        const el = document.querySelector('.overflow-x-auto');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-3.5 border border-[#ECECEC] hover:border-neutral-950 bg-white hover:bg-[#FAFAFA] rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all text-neutral-700 flex flex-col items-center gap-1.5 cursor-pointer text-center"
                    >
                      <ShoppingBag className="w-4 h-4 text-neutral-500" />
                      <span>Order More</span>
                    </button>
                    <button
                      onClick={() => {
                        playUISound('click');
                        setSelectedCategory('Desserts');
                        const el = document.querySelector('.overflow-x-auto');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-3.5 border border-[#ECECEC] hover:border-neutral-950 bg-white hover:bg-[#FAFAFA] rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all text-neutral-700 flex flex-col items-center gap-1.5 cursor-pointer text-center"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Order Dessert</span>
                    </button>
                    {tableId.toLowerCase() === 'takeaway' ? (
                      <div className="p-3.5 border border-[#ECECEC] bg-[#FAFAFA] rounded-2xl text-[11px] text-neutral-700 flex flex-col items-center justify-center gap-1.5 text-center col-span-2">
                        <Clock className="w-4.5 h-4.5 text-amber-500" />
                        <div>
                          <span className="font-bold block uppercase text-[8px] text-neutral-400 tracking-wider">Takeaway Detail</span>
                          <span className="text-[11px] font-semibold text-neutral-900 mt-0.5">
                            {typeof window !== 'undefined' && localStorage.getItem('df_takeaway_type') === 'pickup'
                              ? `Pickup: ${localStorage.getItem('df_takeaway_detail') || '15:00'}`
                              : `Deliver to: ${localStorage.getItem('df_takeaway_detail') || 'Saved Address'}`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => sendRunnerAlert('Coffee Requested', `Table ${tableId} requested coffee.`)}
                          className="p-3.5 border border-[#ECECEC] hover:border-neutral-950 bg-white hover:bg-[#FAFAFA] rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all text-neutral-700 flex flex-col items-center gap-1.5 cursor-pointer text-center"
                        >
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Request Coffee</span>
                        </button>
                        <button
                          onClick={() => sendRunnerAlert('Water Requested', `Table ${tableId} requested mineral water.`)}
                          className="p-3.5 border border-[#ECECEC] hover:border-neutral-950 bg-white hover:bg-[#FAFAFA] rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all text-neutral-700 flex flex-col items-center gap-1.5 cursor-pointer text-center"
                        >
                          <MapPin className="w-4 h-4 text-sky-500" />
                          <span>Request Water</span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-[#ECECEC]">
                    {tableId.toLowerCase() !== 'takeaway' && (
                      <button
                        onClick={() => sendRunnerAlert('Runner Assistance', `Table ${tableId} is calling a runner.`)}
                        className="w-full py-3.5 bg-[#FAFAFA] hover:bg-neutral-100 border border-[#ECECEC] text-neutral-800 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Bell className="w-4 h-4 text-neutral-500" />
                        Call Runner
                      </button>
                    )}
                    <button
                      onClick={() => {
                        playUISound('click');
                        setShowBillRequest(true);
                      }}
                      className="w-full py-3.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-neutral-800"
                    >
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Request Bill
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury">
                  <div className="flex items-center justify-between pb-4 border-b border-[#ECECEC] mb-5">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-neutral-900" />
                      <h3 className="text-[13px] font-bold tracking-tight uppercase">Table Order Card</h3>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-[9px] tracking-wide uppercase font-bold">
                      Live Session
                    </span>
                  </div>

                  {/* Placed orders */}
                  {orders.length > 0 && (
                    <div className="space-y-4 mb-6 pb-6 border-b border-[#ECECEC]">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Cooking In Progress</span>
                      {orders.map(order => (
                        <div key={order.id} className="bg-[#FAFAFA] border border-[#ECECEC] p-4.5 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center text-[12px]">
                            <span className="font-bold text-neutral-850">Order #{order.id.slice(-4)}</span>
                            <span className="px-2.5 py-0.5 bg-neutral-950 text-white rounded text-[9px] tracking-wider uppercase font-bold">
                              {order.status}
                            </span>
                          </div>

                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-[12px] text-neutral-500 font-light">
                                <span>{item.quantity}x {item.name}</span>
                                <span>₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Draft selections */}
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Draft selection</span>
                    {Object.keys(draftCart).length === 0 ? (
                      <div className="py-6 text-center text-neutral-455 text-[12px] font-light">
                        No items drafted yet. Browse catalog or consult concierge.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.keys(draftCart).map(itemId => {
                          const item = menu.find(m => m.id === itemId);
                          return (
                            <div key={itemId} className="flex justify-between items-center text-[12px]">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-neutral-850">{draftCart[itemId]}x</span>
                                <span className="text-neutral-600 font-light">{item?.name}</span>
                              </div>
                              <span className="font-bold text-neutral-800">₹{(item?.price || 0) * draftCart[itemId]}</span>
                            </div>
                          );
                        })}

                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handlePlaceOrder}
                          className="w-full mt-4 py-3.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-neutral-800"
                        >
                          Execute Order & Cook
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Total Invoice */}
                  <div className="mt-6 pt-5 border-t border-[#ECECEC] space-y-2.5">
                    <div className="flex justify-between text-[12px] text-neutral-500">
                      <span>Draft Items</span>
                      <span>₹{getDraftTotal()}</span>
                    </div>
                    <div className="flex justify-between text-[12px] text-neutral-500">
                      <span>Placed Items</span>
                      <span>₹{getPlacedTotal()}</span>
                    </div>
                    <div className="flex justify-between text-[14px] font-bold text-neutral-950 pt-2.5 border-t border-dashed border-[#ECECEC]">
                      <span>Grand Statement Total</span>
                      <span>₹{getGrandTotal()}</span>
                    </div>

                    {getPlacedTotal() > 0 && session.status !== 'payment_pending' && (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleRequestCashPayment}
                        className="w-full mt-4 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      >
                        Request Settlement & Checkout
                      </motion.button>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline Detail */}
              <div className="bg-white border border-[#ECECEC] rounded-[24px] p-6 shadow-luxury">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-4">Dining Session Timeline</span>
                <div className="space-y-4 pl-1">
                  {session.timeline.map((event, idx) => (
                    <div key={idx} className="relative pl-6 pb-2 border-l border-neutral-100 last:border-0 last:pb-0">
                      <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-neutral-300 border-2 border-white" />
                      <span className="text-[9px] font-mono text-neutral-450 block">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      <p className="text-[12px] text-neutral-600 font-light mt-0.5 leading-relaxed">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </main>

          {/* Floating AI Concierge panel trigger - DISABLED */}
          {false && (
          <div className="fixed bottom-6 right-6 z-40">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                playUISound('click');
                setAiOpen(!aiOpen);
              }}
              className="w-14 h-14 bg-neutral-950 text-white rounded-full flex items-center justify-center shadow-2xl border border-neutral-800 cursor-pointer relative"
            >
              {aiOpen ? <X className="w-5.5 h-5.5" /> : <MessageSquare className="w-5.5 h-5.5" />}
              {!aiOpen && (
                <span className="absolute right-[-4px] top-[-4px] w-4 h-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold animate-bounce text-black">
                  AI
                </span>
              )}
            </motion.button>
          </div>
          )}

          {/* Floating AI Concierge expanded body */}
          <AnimatePresence>
            {false && aiOpen && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-24 right-6 w-96 bg-white border border-[#ECECEC] rounded-[24px] shadow-2xl z-40 flex flex-col overflow-hidden max-h-[500px]"
              >
                {/* Header */}
                <div className="bg-neutral-950 text-white p-5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="text-[13px] font-bold tracking-tight">Kings of Wings AI Concierge</h4>
                      <span className="text-[9px] text-neutral-400 font-light block">Dining Concierge active</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      playUISound('click');
                      setAiOpen(false);
                    }}
                    className="text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages scroller */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[300px]">
                  {aiMessages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-3.5 rounded-2xl max-w-[85%] text-[13px] leading-relaxed font-light ${
                        msg.sender === 'user' 
                          ? 'bg-neutral-950 text-white rounded-tr-none' 
                          : 'bg-[#FAFAFA] border border-[#ECECEC] text-neutral-800 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>

                      {/* Recommend dishes block */}
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {msg.recommendations.map(rec => (
                            <button
                              key={rec.id}
                              onClick={() => {
                                addToDraft(rec.id);
                                setAiMessages(prev => [...prev, { sender: 'ai', text: `Added **${rec.name}** (₹${rec.price}) to your table cart.` }]);
                              }}
                              className="px-3 py-1.5 bg-white border border-[#ECECEC] rounded-full text-[10px] font-bold text-neutral-700 hover:border-neutral-450 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              + Add {rec.name} (₹{rec.price})
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Action blocks */}
                      {msg.action && msg.action.type === 'add_to_cart' && (
                        <div className="mt-2.5">
                          <button
                            onClick={() => handleApproveAiOrder(msg.action)}
                            className="px-4 py-2 bg-neutral-955 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-900 transition-colors shadow-luxury cursor-pointer"
                          >
                            Approve Order & Send to Kitchen
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex items-center gap-1.5 text-neutral-450 text-[11px] font-light">
                      <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      <span>Concierge is thinking...</span>
                    </div>
                  )}
                  <div ref={aiEndRef} />
                </div>

                {/* Quick Prompts */}
                <div className="px-5 py-3 border-t border-[#ECECEC] bg-[#FAFAFA] flex flex-wrap gap-1.5">
                  {[
                    { label: 'Chef Specials', q: 'What is today\'s chef recommendation?' },
                    { label: 'Vegetarian Options', q: 'I want something vegetarian' },
                    { label: 'Under ₹500', q: 'Recommend something under ₹500' },
                    { label: 'No Dairy', q: 'I want something with no dairy' }
                  ].map(qp => (
                    <button
                      key={qp.label}
                      onClick={() => handleAiSend(qp.q)}
                      className="px-2.5 py-1.5 bg-white border border-[#ECECEC] hover:border-neutral-350 text-[10px] text-neutral-600 rounded-lg font-bold cursor-pointer"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>

                {/* Input form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAiSend();
                  }}
                  className="p-4 border-t border-[#ECECEC] flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ask the concierge..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[13px] text-neutral-950 placeholder:text-neutral-450 focus:outline-none focus:border-neutral-900 transition-colors"
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 bg-neutral-950 text-white rounded-xl flex items-center justify-center hover:bg-neutral-900 transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Payment Pending Bill Overlay */}
          <AnimatePresence>
            {session.status === 'payment_pending' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-8 rounded-[24px] border border-[#ECECEC] shadow-2xl max-w-sm w-full text-center space-y-5"
                >
                  <div className="w-12 h-12 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <DollarSign className="w-5 h-5 text-neutral-900" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.25em]">Wings Checkout</span>
                    <h3 className="text-lg font-bold text-neutral-955 mt-1">Table {tableId} Statement</h3>
                    <p className="text-[12px] text-neutral-500 mt-2 font-light leading-relaxed">
                      Please choose your checkout method.
                    </p>
                  </div>

                  {/* List of items */}
                  <div className="border-y border-[#ECECEC] py-4 space-y-2 text-left text-[12px] max-h-40 overflow-y-auto">
                    {orders.flatMap(o => o.items).map((item, idx) => (
                      <div key={idx} className="flex justify-between font-light text-neutral-600">
                        <span>{item.quantity}x {item.name}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-neutral-950 pt-2 border-t border-dashed border-[#ECECEC]">
                      <span>Amount Due</span>
                      <span>₹{getGrandTotal()}</span>
                    </div>
                  </div>

                  {session.paymentMethod === 'Cash' ? (
                    <div className="bg-amber-50/50 border border-amber-200 text-amber-800 text-[12px] p-4.5 rounded-2xl flex items-start gap-2.5 text-left leading-relaxed">
                      <Clock className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span className="font-bold block">Awaiting Cash Verification</span>
                        Food Runner is arriving at your table to collect cash. This screen will automatically refresh.
                      </div>
                    </div>
                  ) : isSessionOwner ? (
                    <div className="space-y-3">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleRazorpayPayment}
                        className="w-full py-3.5 bg-neutral-950 text-white hover:bg-neutral-900 rounded-xl text-[12px] font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-800"
                      >
                        Pay Online (Razorpay)
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleRequestCashPayment}
                        className="w-full py-3.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 rounded-xl border border-[#ECECEC] text-[12px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Pay With Cash
                      </motion.button>
                    </div>
                  ) : (
                    <div className="text-[12px] text-rose-500 font-medium bg-rose-50/50 border border-rose-100 p-3 rounded-xl">
                      Awaiting Session Owner ({session.guests[0]?.name}) to pay.
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Premium Receipt Modal Overlay */}
          <AnimatePresence>
            {showReceipt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto"
              >
                <PremiumReceipt
                  receiptNumber={`AUR-${session?.id?.slice(-6) || Date.now().toString().slice(-6)}`}
                  tableName={`Table ${tableId}`}
                  guestName={guestName}
                  items={orders.flatMap(o => o.items)}
                  paymentMethod={session?.paymentMethod || 'Razorpay'}
                  amountPaid={getPlacedTotal()}
                  runnerName={orders.find(o => o.runnerId)?.runnerId || 'runner-alpha'}
                  timestamp={session?.closedAt || new Date().toISOString()}
                  gst={Math.round(getPlacedTotal() * 0.18)}
                  taxes={Math.round(getPlacedTotal() * 0.05)}
                  onClose={() => {
                    localStorage.removeItem('df_guest_name');
                    localStorage.removeItem('df_guest_id');
                    router.push('/');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}
    </div>
  );
}
