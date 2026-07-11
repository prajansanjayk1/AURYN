'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Route, Compass, CheckCircle, Navigation, 
  MapPin, Clock, ArrowRight, RefreshCw, Smartphone, DollarSign, Wallet
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { Order, OrderStatus, DiningSession } from '@/shared/types';
import { RestaurantIntelligence } from '@/modules/ai/intelligence';
import { playUISound } from '@/shared/lib/sounds';

export default function ServiceConsole() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [sessions, setSessions] = useState<DiningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [runnerId] = useState('runner-alpha'); // demo runner ID

  // Cash payment calculator states
  const [activeCashSession, setActiveCashSession] = useState<DiningSession | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>('');

  const getGroupedTables = (ordersList: Order[]) => {
    const groups: { [tableId: string]: Order[] } = {};
    ordersList.forEach(order => {
      if (!groups[order.tableId]) {
        groups[order.tableId] = [];
      }
      groups[order.tableId].push(order);
    });
    
    return Object.entries(groups).sort(([a], [b]) => {
      if (a.toLowerCase() === 'takeaway') return 1;
      if (b.toLowerCase() === 'takeaway') return -1;
      const aNum = parseInt(a, 10);
      const bNum = parseInt(b, 10);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      if (!isNaN(aNum)) return -1;
      if (!isNaN(bNum)) return 1;
      return a.localeCompare(b);
    });
  };
  
  // Real-time Supabase Listeners
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: oData } = await supabase.from('orders').select('*');
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

      const { data: sData } = await supabase.from('sessions').select('*');
      setSessions((sData || []).map((s: any) => ({
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
      })));
      
      setLoading(false);
    };

    fetchInitialData();

    // 2-second auto-refresh interval
    const refreshInterval = setInterval(() => {
      fetchInitialData();
    }, 2000);

    // Subscribe to Supabase Realtime updates
    const channel = supabase.channel('runner-telemetry-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const { data } = await supabase.from('orders').select('*');
        setOrders((data || []).map((o: any) => ({
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
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, async () => {
        const { data } = await supabase.from('sessions').select('*');
        setSessions((data || []).map((s: any) => ({
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
        })));
      })
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStartDelivery = async (orderId: string) => {
    playUISound('click');
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      if (!targetOrder) return;

      // Calculate path with Runner Intelligence
      const readyOrders = orders.filter(o => o.status === 'ready');
      const routeInfo = RestaurantIntelligence.calculateOptimalRoute(targetOrder.tableId, readyOrders);

      await supabase.from('orders').update({
        status: 'delivering',
        runner_id: runnerId,
        runner_route: routeInfo.path,
        updated_at: new Date().toISOString()
      }).eq('id', orderId);
      
      // Update session timeline
      const activeSess = sessions.find(s => s.id === targetOrder.sessionId);
      const updatedTimeline = [
        ...(activeSess?.timeline || []),
        {
          timestamp: new Date().toISOString(),
          type: 'order.delivering',
          description: `Food Runner ${runnerId} assigned to deliver Order ${orderId.slice(-4)}.`
        }
      ];
      await supabase.from('sessions').update({ timeline: updatedTimeline }).eq('id', targetOrder.sessionId);

      playUISound('runner_assigned');
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const handleStartTableDelivery = async (tableId: string, tableOrders: Order[]) => {
    playUISound('click');
    try {
      const readyOrders = orders.filter(o => o.status === 'ready');
      const routeInfo = RestaurantIntelligence.calculateOptimalRoute(tableId, readyOrders);

      for (const order of tableOrders) {
        await supabase.from('orders').update({
          status: 'delivering',
          runner_id: runnerId,
          runner_route: routeInfo.path,
          updated_at: new Date().toISOString()
        }).eq('id', order.id);

        const activeSess = sessions.find(s => s.id === order.sessionId);
        const updatedTimeline = [
          ...(activeSess?.timeline || []),
          {
            timestamp: new Date().toISOString(),
            type: 'order.delivering',
            description: `Food Runner ${runnerId} assigned to deliver Order ${order.id.slice(-4)}.`
          }
        ];
        await supabase.from('sessions').update({ timeline: updatedTimeline }).eq('id', order.sessionId);
      }

      playUISound('runner_assigned');
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const handleCompleteDelivery = async (orderId: string) => {
    playUISound('click');
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      if (!targetOrder) return;

      await supabase.from('orders').update({
        status: 'delivered',
        updated_at: new Date().toISOString()
      }).eq('id', orderId);

      // Update session timeline
      const activeSess = sessions.find(s => s.id === targetOrder.sessionId);
      const updatedTimeline = [
        ...(activeSess?.timeline || []),
        {
          timestamp: new Date().toISOString(),
          type: 'order.delivered',
          description: `Order ${orderId.slice(-4)} successfully delivered to Table ${targetOrder.tableId}.`
        }
      ];
      await supabase.from('sessions').update({ timeline: updatedTimeline }).eq('id', targetOrder.sessionId);

      playUISound('success');
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  // Cash validation workflow
  const handleConfirmCashPayment = async () => {
    if (!activeCashSession) return;
    playUISound('click');

    const total = getSessionTotal(activeCashSession);
    const received = parseFloat(amountReceived) || 0;
    
    if (received < total) {
      playUISound('error');
      alert(`Amount received (₹${received}) must be equal to or greater than the bill amount (₹${total})`);
      return;
    }

    try {
      // 1. Create Receipt document in Supabase public.receipts
      const receiptId = `rcpt-${Date.now()}`;
      await supabase.from('receipts').insert({
        id: receiptId,
        restaurant_id: 'auryn-hq',
        branch_id: 'main-branch',
        receipt_number: `AUR-${Date.now().toString().slice(-6)}`,
        session_id: activeCashSession.id,
        table_id: activeCashSession.tableId,
        items: getSessionItems(activeCashSession),
        payment_method: 'Cash',
        amount_paid: total,
        amount_received: received,
        change_returned: received - total,
        runner_name: runnerId,
        timestamp: new Date().toISOString(),
        gst: Math.round(total * 0.18),
        taxes: Math.round(total * 0.05)
      });

      // 2. Close Dining Session in public.sessions
      const updatedTimeline = [
        ...activeCashSession.timeline,
        {
          timestamp: new Date().toISOString(),
          type: 'payment.completed',
          description: `Payment completed in Cash. Collected ₹${received}, returned ₹${received - total}.`
        },
        {
          timestamp: new Date().toISOString(),
          type: 'session.closed',
          description: 'Dining session completed and table cleared.'
        }
      ];
      await supabase.from('sessions').update({
        status: 'completed',
        closed_at: new Date().toISOString(),
        timeline: updatedTimeline
      }).eq('id', activeCashSession.id);

      // 3. Clear Table status
      await supabase.from('tables').update({
        status: 'available',
        current_session_id: null
      }).eq('id', activeCashSession.tableId);

      // 4. Record Audit Log
      const auditId = `log-${Date.now()}`;
      await supabase.from('audit_logs').insert({
        id: auditId,
        timestamp: new Date().toISOString(),
        action: 'payment.completed',
        details: `Cash payment completed at Table ${activeCashSession.tableId}. Total: ₹${total}, change returned: ₹${received - total}.`,
        restaurant_id: 'auryn-hq',
        branch_id: 'main-branch'
      });

      playUISound('payment_success');
      setActiveCashSession(null);
      setAmountReceived('');
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const getSessionOrders = (session: DiningSession) => {
    return orders.filter(o => o.sessionId === session.id);
  };

  const getSessionTotal = (session: DiningSession) => {
    return getSessionOrders(session).reduce((sum, order) => {
      return sum + order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }, 0);
  };

  const getSessionItems = (session: DiningSession) => {
    return getSessionOrders(session).flatMap(o => o.items);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center p-6 text-white">
        <Sparkles className="w-8 h-8 text-amber-500 animate-spin mb-4" />
        <span className="text-[12px] tracking-widest text-neutral-400 font-bold uppercase">Runner Console Syncing...</span>
      </div>
    );
  }

  // Filter queues
  const dispatchQueue = orders.filter(o => o.status === 'ready');
  const activeDeliveries = orders.filter(o => o.status === 'delivering' && o.runnerId === runnerId);
  const cashRequests = sessions.filter(s => s.status === 'payment_pending' && s.paymentMethod === 'Cash');

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 pb-16 selection:bg-neutral-200 flex flex-col items-center">
      
      {/* Mobile Shell Wrapper */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-luxury border-x border-[#ECECEC] flex flex-col">
        
        {/* Top Header */}
        <header className="bg-white border-b border-[#ECECEC] px-6 py-5 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4.5 h-4.5 text-neutral-950" />
            <div>
              <h1 className="text-[13px] font-bold uppercase tracking-wider text-neutral-955">Wings Runner</h1>
              <span className="text-[10px] text-neutral-400 font-semibold block uppercase tracking-wider">Device ID: {runnerId}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Synced</span>
          </div>
        </header>

        {/* Content area */}
        <main className="p-6 flex-1 space-y-6">
          
          {/* CASH REQUESTS SECTION */}
          {cashRequests.length > 0 && (
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block animate-pulse">⚠️ Cash Payment Required</span>
              <div className="space-y-3">
                {cashRequests.map(session => {
                  const billTotal = getSessionTotal(session);
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-rose-50/40 border border-rose-100 p-4.5 rounded-[20px] space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">Cash Collector Alert</span>
                          <h3 className="text-md font-bold text-neutral-955 mt-0.5">Table {session.tableId}</h3>
                        </div>
                        <span className="text-md font-bold text-rose-600">₹{billTotal}</span>
                      </div>

                      <button
                        onClick={() => {
                          playUISound('click');
                          setActiveCashSession(session);
                        }}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        Open Cash checkout
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Deliveries */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Active Delivery Roster</span>
            {activeDeliveries.map(order => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-950 text-white p-5 rounded-[20px] shadow-luxury space-y-4 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Destination Table</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">Table {order.tableId}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-[10px] text-neutral-200">
                    <Clock className="w-3 h-3 text-neutral-300" />
                    <span>Est: 1m 30s</span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-white/10 pt-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[12px] font-light text-neutral-200">
                      <span>{item.quantity}x {item.name}</span>
                    </div>
                  ))}
                </div>

                {/* Optimised Path */}
                {order.runnerRoute && order.runnerRoute.length > 0 && (
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-1.5 text-[11px]">
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">Wings Vector Path</span>
                    <div className="flex items-center flex-wrap gap-1 font-semibold text-neutral-300">
                      {order.runnerRoute.map((node, idx) => (
                        <React.Fragment key={idx}>
                          <span>{node}</span>
                          {idx < order.runnerRoute.length - 1 && <ArrowRight className="w-3 h-3 text-neutral-500" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleCompleteDelivery(order.id)}
                  className="w-full py-3 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(255,255,255,0.1)] cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Mark as Delivered
                </button>
              </motion.div>
            ))}

            {activeDeliveries.length === 0 && (
              <div className="border border-dashed border-[#ECECEC] rounded-[20px] p-8 text-center text-neutral-400 text-[12px] font-light">
                No active delivery tasks. Select one below.
              </div>
            )}
          </div>

          {/* Dispatch Queue (Ready orders) */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Ready for Dispatch ({dispatchQueue.length} tickets)</span>
            <div className="space-y-3">
              {getGroupedTables(dispatchQueue).map(([tableId, tableOrders]) => (
                <div key={tableId} className="bg-white border border-[#ECECEC] p-5 rounded-[20px] shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide">Ready at Hot Station</span>
                      <h3 className="text-md font-bold text-neutral-900 mt-0.5">
                        {tableId.toLowerCase() === 'takeaway' ? 'Takeaway Orders' : `Table ${tableId}`}
                      </h3>
                      <span className="text-[9px] text-neutral-450 mt-0.5 block">{tableOrders.length} {tableOrders.length === 1 ? 'Order' : 'Orders'} ready</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-bold uppercase tracking-wider">
                      Hot Deck
                    </span>
                  </div>

                  <div className="space-y-4 border-t border-neutral-100 pt-3 divide-y divide-neutral-50">
                    {tableOrders.map(order => (
                      <div key={order.id} className="pt-3 first:pt-0">
                        <span className="text-[9px] font-bold text-[#FF5A09] uppercase tracking-wider block mb-1">Order #{order.id.slice(-4)}</span>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-[12px] text-neutral-600">
                              <span>{item.quantity}x {item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleStartTableDelivery(tableId, tableOrders)}
                    className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Accept & Dispatch All
                  </button>
                </div>
              ))}
              {dispatchQueue.length === 0 && (
                <div className="border border-dashed border-[#ECECEC] rounded-[20px] p-8 text-center text-neutral-400 text-[12px] font-light">
                  Awaiting dispatch items.
                </div>
              )}
            </div>
          </div>

        </main>
      </div>

      {/* Cash payment modal */}
      <AnimatePresence>
        {activeCashSession && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-[28px] sm:rounded-[28px] border-t sm:border border-[#ECECEC] p-6 max-w-sm w-full space-y-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
            >
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                <div>
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Runner Cash Drawer</span>
                  <h3 className="text-[15px] font-bold text-neutral-955 mt-0.5">Collect Cash: Table {activeCashSession.tableId}</h3>
                </div>
                <button
                  onClick={() => {
                    playUISound('click');
                    setActiveCashSession(null);
                    setAmountReceived('');
                  }}
                  className="w-7 h-7 bg-neutral-50 border border-neutral-100 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-950 cursor-pointer"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bill Details */}
              <div className="space-y-2 text-[12px] bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                <div className="flex justify-between text-neutral-500">
                  <span>Gross Total</span>
                  <span className="font-bold text-neutral-900">₹{getSessionTotal(activeCashSession)}</span>
                </div>
              </div>

              {/* Input Calculator */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5 pl-0.5">Amount Given by Customer (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-[14px]">₹</span>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 1000"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-[#ECECEC] bg-[#FAFAFA] text-[15px] font-bold text-neutral-955 placeholder:text-neutral-400 focus:outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>

                {amountReceived && parseFloat(amountReceived) >= getSessionTotal(activeCashSession) && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between text-[13px] text-emerald-800 font-semibold">
                    <span>Change to Return:</span>
                    <span className="text-emerald-700 font-bold text-[14px]">₹{parseFloat(amountReceived) - getSessionTotal(activeCashSession)}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleConfirmCashPayment}
                className="w-full py-3.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Confirm Payment & Close Session
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
