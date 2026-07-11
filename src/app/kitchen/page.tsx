'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ChefHat, Clock, AlertTriangle, CheckCircle, 
  Flame, RefreshCw, ChevronRight, Play, Bell, ClipboardCheck
} from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { Order, OrderStatus } from '@/shared/types';
import { playUISound } from '@/shared/lib/sounds';

export default function KitchenStudio() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [kitchenLoad, setKitchenLoad] = useState(25); // percentage

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

  // Fetch orders from Supabase PostgreSQL
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*');
      if (error) throw error;

      const mapped = (data || []).map((o: any) => ({
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
      
      setOrders(mapped);

      // Calculate kitchen load
      const activeCooking = mapped.filter((o: any) => o.status === 'preparing' || o.status === 'quality_check');
      const load = Math.min(95, 10 + activeCooking.length * 15);
      setKitchenLoad(load);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // 2-second auto-refresh interval
    const refreshInterval = setInterval(() => {
      fetchOrders();
    }, 2000);

    // Subscribe to order modifications in real-time
    const channel = supabase.channel('kitchen-studio-telemetry')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    playUISound('click');
    try {
      // If marking whole order as ready, make sure all items are marked as ready too
      let updatePayload: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'ready' || newStatus === 'quality_check') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          updatePayload.items = order.items.map(item => ({
            ...item,
            status: 'ready'
          }));
        }
      }

      const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);

      if (error) throw error;
      playUISound('success');
      fetchOrders();
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  const toggleItemStatus = async (orderId: string, itemIndex: number) => {
    playUISound('click');
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updatedItems = [...order.items];
      const currentItem = updatedItems[itemIndex];
      const newStatus = currentItem.status === 'ready' ? 'preparing' : 'ready';
      
      updatedItems[itemIndex] = {
        ...currentItem,
        status: newStatus
      };

      // Check if all items are now marked as ready
      const allReady = updatedItems.every(item => item.status === 'ready');
      
      let newOrderStatus = order.status;
      if (allReady) {
        if (order.status === 'preparing') {
          newOrderStatus = 'quality_check';
        } else if (order.status === 'quality_check') {
          newOrderStatus = 'ready';
        }
      } else {
        if (order.status === 'quality_check' || order.status === 'ready') {
          newOrderStatus = 'preparing';
        }
      }

      const { error } = await supabase.from('orders').update({
        items: updatedItems,
        status: newOrderStatus,
        updated_at: new Date().toISOString()
      }).eq('id', orderId);

      if (error) throw error;
      playUISound('success');
      fetchOrders();
    } catch (e) {
      console.error(e);
      playUISound('error');
    }
  };

  // Organize orders into 5 distinct operational lanes
  const incomingOrders = orders.filter(o => o.status === 'placed');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const qcOrders = orders.filter(o => o.status === 'quality_check');
  const readyOrders = orders.filter(o => o.status === 'ready' || o.status === 'delivering');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-white">
        <Sparkles className="w-8 h-8 text-amber-500 animate-spin mb-4" />
        <span className="text-[12px] tracking-[0.2em] font-semibold text-neutral-400 uppercase">Synchronizing Kitchen Studio...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 pb-12 selection:bg-neutral-200">
      
      {/* Header Deck */}
      <header className="bg-white border-b border-[#ECECEC] px-6 md:px-12 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-neutral-500" />
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Back of House Operations</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-950 mt-0.5">
            Kings of Wings Hot Deck
          </h1>
        </div>

        {/* Live Load Meter & Refresh Button */}
        <div className="flex items-center gap-5 w-full md:w-auto">
          {/* Load indicator */}
          <div className="flex-1 md:flex-initial bg-[#FAFAFA] border border-[#ECECEC] rounded-2xl p-3 flex items-center gap-4 min-w-[200px] shadow-sm">
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-bold tracking-tight uppercase text-neutral-400 mb-1">
                <span>Kitchen Load Telemetry</span>
                <span>{kitchenLoad}%</span>
              </div>
              <div className="w-full bg-[#ECECEC] h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    kitchenLoad > 75 ? 'bg-rose-500' : kitchenLoad > 45 ? 'bg-yellow-500' : 'bg-neutral-900'
                  }`}
                  style={{ width: `${kitchenLoad}%` }}
                />
              </div>
            </div>
          </div>

          <button 
            onClick={fetchOrders}
            className="w-11 h-11 bg-white border border-[#ECECEC] rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-950 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Studio Lanes */}
      <main className="px-6 md:px-12 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-start">
        
        {/* Lane 1: Incoming */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#ECECEC]">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-450">1. Incoming</span>
              <span className="px-2 py-0.5 bg-neutral-955 text-white rounded text-[10px] font-bold">
                {incomingOrders.length}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {getGroupedTables(incomingOrders).map(([tableId, tableOrders]) => (
              <motion.div
                key={tableId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-dashed border-rose-200 p-5 rounded-[20px] shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[12px] font-bold uppercase tracking-wide ${tableId.toLowerCase() === 'takeaway' ? 'text-rose-500' : 'text-[#FF5A09]'}`}>
                      {tableId.toLowerCase() === 'takeaway' ? 'Takeaway Hub' : `Table ${tableId}`}
                    </span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">{tableOrders.length} {tableOrders.length === 1 ? 'Order' : 'Orders'} Pending</span>
                  </div>
                </div>

                <div className="space-y-4 border-t border-[#FAFAFA] pt-3 divide-y divide-[#FAFAFA]">
                  {tableOrders.map(order => (
                    <div key={order.id} className="pt-3 first:pt-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-neutral-500">Order #{order.id.slice(-4)}</span>
                        <span className="text-[10px] text-neutral-400 font-light">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[12px] text-neutral-700 font-medium">
                            <span>{item.quantity}x {item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={async () => {
                    for (const order of tableOrders) {
                      await updateStatus(order.id, 'preparing');
                    }
                  }}
                  className="w-full py-2.5 bg-neutral-955 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  Accept All for Table
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
            {incomingOrders.length === 0 && (
              <div className="py-10 text-center text-neutral-400 text-[12px] font-light border border-dashed border-[#ECECEC] rounded-[20px]">
                Awaiting orders.
              </div>
            )}
          </div>
        </div>

        {/* Lane 2: Preparing */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#ECECEC]">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-450">2. Preparing</span>
              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold">
                {preparingOrders.length}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {getGroupedTables(preparingOrders).map(([tableId, tableOrders]) => (
              <motion.div
                key={tableId}
                layout
                className="bg-white border border-[#ECECEC] p-5 rounded-[20px] shadow-sm space-y-4 border-l-4 border-l-[#FF5A09]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[12px] font-bold uppercase tracking-wide ${tableId.toLowerCase() === 'takeaway' ? 'text-rose-500' : 'text-[#FF5A09]'}`}>
                      {tableId.toLowerCase() === 'takeaway' ? 'Takeaway Hub' : `Table ${tableId}`}
                    </span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">{tableOrders.length} {tableOrders.length === 1 ? 'Active Order' : 'Active Orders'}</span>
                  </div>
                </div>

                <div className="space-y-5 border-t border-[#FAFAFA] pt-3 divide-y divide-[#FAFAFA]">
                  {tableOrders.map(order => (
                    <div key={order.id} className="space-y-3 pt-3 first:pt-0">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-neutral-400">Order #{order.id.slice(-4)}</span>
                        <span className="text-[10px] text-neutral-400 bg-neutral-50 px-2 py-1 rounded-md">
                          Forecast: <b>{order.estimatedCompletion}</b> ({order.confidenceScore}%)
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => {
                          const isReady = item.status === 'ready';
                          return (
                            <div 
                              key={idx} 
                              onClick={() => toggleItemStatus(order.id, idx)}
                              className={`flex justify-between items-center text-[12px] p-2 rounded-lg cursor-pointer transition-colors ${
                                isReady 
                                  ? 'bg-emerald-50/50 text-emerald-800 border border-emerald-100/50 line-through' 
                                  : 'hover:bg-neutral-50 text-neutral-700 font-medium border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={isReady} 
                                  readOnly 
                                  className="w-3.5 h-3.5 rounded text-neutral-900 border-neutral-300 focus:ring-0 cursor-pointer"
                                />
                                <span>{item.quantity}x {item.name}</span>
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                isReady ? 'text-emerald-600' : 'text-neutral-400'
                              }`}>
                                {isReady ? 'Ready' : 'Prep'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => updateStatus(order.id, 'quality_check')}
                        className="w-full py-2 bg-[#FF5A09] hover:bg-[#FF5A09]/90 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Send Order #{order.id.slice(-4)} to QC
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
            {preparingOrders.length === 0 && (
              <div className="py-10 text-center text-neutral-400 text-[12px] font-light border border-dashed border-[#ECECEC] rounded-[20px]">
                No active tickets.
              </div>
            )}
          </div>
        </div>

        {/* Lane 3: Quality Check */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#ECECEC]">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-455">3. Quality Check</span>
              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold">
                {qcOrders.length}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {getGroupedTables(qcOrders).map(([tableId, tableOrders]) => (
              <motion.div
                key={tableId}
                layout
                className="bg-white border border-[#ECECEC] p-5 rounded-[20px] shadow-sm space-y-4 border-l-4 border-l-purple-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[12px] font-bold uppercase tracking-wide ${tableId.toLowerCase() === 'takeaway' ? 'text-rose-500' : 'text-[#FF5A09]'}`}>
                      {tableId.toLowerCase() === 'takeaway' ? 'Takeaway Hub' : `Table ${tableId}`}
                    </span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">{tableOrders.length} {tableOrders.length === 1 ? 'Order' : 'Orders'} in QC</span>
                  </div>
                </div>

                <div className="space-y-5 border-t border-[#FAFAFA] pt-3 divide-y divide-[#FAFAFA]">
                  {tableOrders.map(order => (
                    <div key={order.id} className="space-y-3 pt-3 first:pt-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold text-neutral-400">Order #{order.id.slice(-4)}</span>
                      </div>

                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => {
                          const isReady = item.status === 'ready';
                          return (
                            <div 
                              key={idx} 
                              onClick={() => toggleItemStatus(order.id, idx)}
                              className={`flex justify-between items-center text-[12px] p-2 rounded-lg cursor-pointer transition-colors ${
                                isReady 
                                  ? 'bg-emerald-50/50 text-emerald-800 border border-emerald-100/50 line-through' 
                                  : 'hover:bg-neutral-50 text-neutral-700 font-medium border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={isReady} 
                                  readOnly 
                                  className="w-3.5 h-3.5 rounded text-neutral-900 border-neutral-300 focus:ring-0 cursor-pointer"
                                />
                                <span>{item.quantity}x {item.name}</span>
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                isReady ? 'text-emerald-600' : 'text-neutral-400'
                              }`}>
                                {isReady ? 'Ready' : 'Prep'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="w-full py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve Order #{order.id.slice(-4)}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
            {qcOrders.length === 0 && (
              <div className="py-10 text-center text-neutral-400 text-[12px] font-light border border-dashed border-[#ECECEC] rounded-[20px]">
                No items in inspection.
              </div>
            )}
          </div>
        </div>

        {/* Lane 4: Ready */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#ECECEC]">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-450">4. Ready</span>
              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold">
                {readyOrders.length}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {getGroupedTables(readyOrders).map(([tableId, tableOrders]) => (
              <motion.div
                key={tableId}
                layout
                className="bg-white border border-[#ECECEC] p-5 rounded-[20px] shadow-sm space-y-4 border-l-4 border-l-emerald-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[12px] font-bold uppercase tracking-wide ${tableId.toLowerCase() === 'takeaway' ? 'text-rose-500' : 'text-[#FF5A09]'}`}>
                      {tableId.toLowerCase() === 'takeaway' ? 'Takeaway Hub' : `Table ${tableId}`}
                    </span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">{tableOrders.length} {tableOrders.length === 1 ? 'Order' : 'Orders'} Ready</span>
                  </div>
                </div>

                <div className="space-y-4 border-t border-[#FAFAFA] pt-3 divide-y divide-[#FAFAFA]">
                  {tableOrders.map(order => (
                    <div key={order.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-neutral-500">Order #{order.id.slice(-4)}</span>
                        <span className={`px-2 py-0.5 border rounded text-[9px] font-bold tracking-wide uppercase ${
                          order.status === 'ready' ? 'bg-indigo-50 text-indigo-650 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {order.status === 'ready' ? 'Hot Deck' : 'Runner'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[12px] text-neutral-600">
                            <span>{item.quantity}x {item.name}</span>
                          </div>
                        ))}
                      </div>

                      {order.runnerId && (
                        <div className="bg-[#FAFAFA] border border-[#ECECEC] p-2.5 rounded-xl flex items-center justify-between text-[10px] text-neutral-500">
                          <span>Runner: <b>{order.runnerId}</b></span>
                          <span className="font-semibold text-neutral-700">{order.runnerRoute.join(' → ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
            {readyOrders.length === 0 && (
              <div className="py-10 text-center text-neutral-400 text-[12px] font-light border border-dashed border-[#ECECEC] rounded-[20px]">
                Hot deck is clear.
              </div>
            )}
          </div>
        </div>

        {/* Lane 5: Delivered */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#ECECEC]">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-neutral-450">5. Delivered</span>
              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold">
                {deliveredOrders.length}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {getGroupedTables(deliveredOrders).map(([tableId, tableOrders]) => (
              <motion.div
                key={tableId}
                layout
                className="bg-white border border-[#ECECEC] p-5 rounded-[20px] shadow-sm space-y-4 opacity-75"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[12px] font-bold uppercase tracking-wide ${tableId.toLowerCase() === 'takeaway' ? 'text-rose-500' : 'text-neutral-400'}`}>
                      {tableId.toLowerCase() === 'takeaway' ? 'Takeaway Hub' : `Table ${tableId}`}
                    </span>
                    <span className="text-[10px] text-neutral-400 block mt-0.5">{tableOrders.length} {tableOrders.length === 1 ? 'Order' : 'Orders'} Served</span>
                  </div>
                </div>

                <div className="space-y-4 border-t border-[#FAFAFA] pt-3 divide-y divide-[#FAFAFA]">
                  {tableOrders.slice(0, 4).map(order => (
                    <div key={order.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex justify-between items-center text-[12px]">
                        <span className="font-bold text-neutral-900">Order #{order.id.slice(-4)}</span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="space-y-1 text-[12px] text-neutral-500">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
            {deliveredOrders.length === 0 && (
              <div className="py-10 text-center text-neutral-400 text-[12px] font-light border border-dashed border-[#ECECEC] rounded-[20px]">
                No served orders.
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
