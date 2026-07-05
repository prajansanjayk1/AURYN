'use client';

import React from 'react';
import { Printer, Download, Share2, Sparkles, CheckCircle2 } from 'lucide-react';
import { playUISound } from '../lib/sounds';

export interface ReceiptProps {
  receiptNumber: string;
  tableName: string;
  guestName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  paymentMethod: string;
  amountPaid: number;
  amountReceived?: number;
  changeReturned?: number;
  runnerName?: string;
  timestamp: string;
  gst: number;
  taxes: number;
  onClose?: () => void;
}

export default function PremiumReceipt({
  receiptNumber,
  tableName,
  guestName,
  items,
  paymentMethod,
  amountPaid,
  amountReceived,
  changeReturned,
  runnerName,
  timestamp,
  gst,
  taxes,
  onClose
}: ReceiptProps) {
  
  const handlePrint = () => {
    playUISound('click');
    window.print();
  };

  const handleDownload = () => {
    playUISound('click');
    // Generate simple text file blob and download it as an receipt export
    const content = `
AURYN HOSPITALITY INTELLIGENCE
Receipt Number: ${receiptNumber}
Date: ${new Date(timestamp).toLocaleString()}
Table: ${tableName}
Guest: ${guestName}
----------------------------------
${items.map(i => `${i.quantity}x ${i.name} - ₹${i.price * i.quantity}`).join('\n')}
----------------------------------
Subtotal: ₹${amountPaid - gst - taxes}
GST (18%): ₹${gst}
Service Tax (5%): ₹${taxes}
Total Paid: ₹${amountPaid}
Payment Method: ${paymentMethod}
${runnerName ? `Assigned Runner: ${runnerName}` : ''}
${amountReceived ? `Cash Received: ₹${amountReceived}` : ''}
${changeReturned ? `Change Returned: ₹${changeReturned}` : ''}
----------------------------------
Thank you for dining at AURYN.
Verify this statement online at verification.auryn.ai/${receiptNumber}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AURYN_Receipt_${receiptNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    playUISound('click');
    if (navigator.share) {
      navigator.share({
        title: 'AURYN Dining Receipt',
        text: `My dining statement from AURYN: Receipt #${receiptNumber}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      alert(`Statement link ready to share: verification.auryn.ai/${receiptNumber}`);
    }
  };

  return (
    <div className="bg-white border border-[#ECECEC] rounded-[28px] p-6 max-w-sm w-full shadow-2xl space-y-6 text-neutral-900 font-sans print:border-none print:shadow-none">
      
      {/* Brand logo header */}
      <div className="text-center space-y-1.5 border-b border-dashed border-[#ECECEC] pb-5">
        <div className="w-10 h-10 bg-neutral-950 rounded-xl flex items-center justify-center mx-auto mb-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>
        <h2 className="text-[15px] font-bold uppercase tracking-[0.25em] text-neutral-950">AURYN</h2>
        <span className="text-[10px] text-neutral-400 font-semibold tracking-wider block uppercase">Hospitality Intelligence</span>
      </div>

      {/* Roster detail */}
      <div className="space-y-2 text-[11px] text-neutral-500 border-b border-neutral-100 pb-4 leading-normal">
        <div className="flex justify-between">
          <span>Receipt Number</span>
          <span className="font-mono font-semibold text-neutral-950">{receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Dining Table</span>
          <span className="font-semibold text-neutral-950">{tableName}</span>
        </div>
        <div className="flex justify-between">
          <span>Guest Name</span>
          <span className="font-semibold text-neutral-950">{guestName}</span>
        </div>
        <div className="flex justify-between">
          <span>Checkout Time</span>
          <span className="font-semibold text-neutral-950">{new Date(timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Items breakdown list */}
      <div className="space-y-2.5 max-h-40 overflow-y-auto">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-[12px] font-light">
            <span className="text-neutral-600">{item.quantity}x {item.name}</span>
            <span className="font-semibold text-neutral-900">₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Tax Breakout & Totals */}
      <div className="space-y-2 border-t border-dashed border-[#ECECEC] pt-4.5 text-[11px] text-neutral-500">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{amountPaid - gst - taxes}</span>
        </div>
        <div className="flex justify-between">
          <span>GST (18%)</span>
          <span>₹{gst}</span>
        </div>
        <div className="flex justify-between">
          <span>Service Tax (5%)</span>
          <span>₹{taxes}</span>
        </div>
        <div className="flex justify-between text-[14px] font-bold text-neutral-950 pt-2 border-t border-neutral-150">
          <span>Gross Sum</span>
          <span className="text-[15px]">₹{amountPaid}</span>
        </div>
      </div>

      {/* Transaction status */}
      <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3 text-left">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-bold text-emerald-800 block">Settle Success</span>
          Paid via {paymentMethod}. {runnerName ? `Handled by ${runnerName}.` : ''}
          {amountReceived !== undefined && (
            <div className="mt-1 font-mono text-[10px] text-neutral-600">
              Cash: ₹{amountReceived} | Change: ₹{changeReturned}
            </div>
          )}
        </div>
      </div>

      {/* Actions panel */}
      <div className="grid grid-cols-3 gap-2.5 pt-2 print:hidden">
        <button 
          onClick={handlePrint}
          className="py-2 px-3 border border-[#ECECEC] hover:border-neutral-400 rounded-xl flex flex-col items-center justify-center text-neutral-500 hover:text-neutral-950 gap-1 text-[9px] font-bold uppercase tracking-wider cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
        <button 
          onClick={handleDownload}
          className="py-2 px-3 border border-[#ECECEC] hover:border-neutral-400 rounded-xl flex flex-col items-center justify-center text-neutral-500 hover:text-neutral-950 gap-1 text-[9px] font-bold uppercase tracking-wider cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>PDF</span>
        </button>
        <button 
          onClick={handleShare}
          className="py-2 px-3 border border-[#ECECEC] hover:border-neutral-400 rounded-xl flex flex-col items-center justify-center text-neutral-500 hover:text-neutral-950 gap-1 text-[9px] font-bold uppercase tracking-wider cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer print:hidden text-center block"
        >
          Close & Done
        </button>
      )}

      {/* Fine-print verification */}
      <div className="text-center text-[9px] text-neutral-400 font-light border-t border-neutral-100 pt-3">
        <span>AURYN Verification Hash: <b>{receiptNumber.slice(0, 12)}</b></span>
      </div>

    </div>
  );
}
