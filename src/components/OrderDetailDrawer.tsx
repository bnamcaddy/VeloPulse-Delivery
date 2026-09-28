import React, { useState } from 'react';
import { DeliveryOrder, DeliveryStatus, Rider } from '../types';
import { 
  X, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Truck, 
  Phone, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  FileText, 
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/logistics';
import { SoundEffects } from '../services/storageService';

interface OrderDetailDrawerProps {
  order: DeliveryOrder | null;
  riders: Rider[];
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: DeliveryStatus, reason?: any) => void;
  onOpenAssignModal: (order: DeliveryOrder) => void;
  onOpenCodeModal: (order: DeliveryOrder) => void;
  onOpenNotificationDrawer: (order: DeliveryOrder) => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  riders,
  onClose,
  onUpdateStatus,
  onOpenAssignModal,
  onOpenCodeModal,
  onOpenNotificationDrawer,
}) => {
  if (!order) return null;

  const assignedRider = riders.find(r => r.id === order.assignedRiderId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 h-full shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-neutral-900 dark:text-white">
                {order.trackingNumber}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold capitalize">
                {order.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Created {formatDateTime(order.createdAt)} · SLA Target {formatDateTime(order.estimatedDeliveryTime)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Action Ribbon */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onOpenCodeModal(order)}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 flex flex-col items-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-neutral-900 dark:text-white">Passcode</span>
              <span className="font-mono text-[10px] text-neutral-500">{order.deliveryCode}</span>
            </button>

            <button
              onClick={() => onOpenAssignModal(order)}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 flex flex-col items-center gap-1 transition-colors"
            >
              <Truck className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-neutral-900 dark:text-white">Assignee</span>
              <span className="truncate max-w-[80px] text-[10px] text-neutral-500">{order.assignedRiderName || 'None'}</span>
            </button>

            <button
              onClick={() => onOpenNotificationDrawer(order)}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 flex flex-col items-center gap-1 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-neutral-900 dark:text-white">Alerts</span>
              <span className="text-[10px] text-neutral-500">{order.notifications?.length || 0} sent</span>
            </button>
          </div>

          {/* Status Lifecycle Transition Buttons */}
          <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block">
              Dispatcher Lifecycle Override
            </span>
            <div className="flex flex-wrap gap-1.5">
              {order.status !== 'delivered' && (
                <>
                  <button
                    onClick={() => {
                      onUpdateStatus(order.id, 'out_for_delivery');
                      SoundEffects.playNotificationTone();
                    }}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                  >
                    Mark Out for Delivery
                  </button>
                  <button
                    onClick={() => {
                      onUpdateStatus(order.id, 'delivered');
                      SoundEffects.playSuccessChime();
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                  >
                    Mark Delivered
                  </button>
                  <button
                    onClick={() => {
                      onUpdateStatus(order.id, 'failed', 'recipient_unavailable');
                      SoundEffects.playAlertTone();
                    }}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors"
                  >
                    Mark Failed Attempt
                  </button>
                </>
              )}
              {order.status === 'delivered' && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Finalized with Proof of Delivery
                </span>
              )}
            </div>
          </div>

          {/* Sender & Recipient Nodes */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Pickup Origin</span>
              <div className="font-semibold text-neutral-900 dark:text-white">{order.senderName}</div>
              <div className="text-neutral-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                <span>{order.pickupAddress}, {order.pickupCity}</span>
              </div>
              <div className="text-neutral-400 font-mono">{order.senderPhone}</div>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Delivery Destination</span>
              <div className="font-semibold text-neutral-900 dark:text-white">{order.recipientName}</div>
              <div className="text-neutral-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{order.deliveryAddress}, {order.deliveryCity}</span>
              </div>
              <div className="text-neutral-400 font-mono">{order.recipientPhone}</div>
              {order.deliveryNotes && (
                <div className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg mt-1">
                  Note: {order.deliveryNotes}
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Ledger Details */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Financial Ledger</span>
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500">Gross Delivery Charge</span>
              <span className="font-mono font-semibold text-neutral-900 dark:text-white">{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500">Rider Commission</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(order.riderCommission)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-500">Cash on Delivery (COD)</span>
              <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                {order.codAmount > 0 ? formatCurrency(order.codAmount) : 'None (Prepaid)'}
              </span>
            </div>
            <div className="flex justify-between pt-1 font-semibold text-neutral-900 dark:text-white">
              <span>Consignment Net Margin</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                {formatCurrency(order.deliveryFee - order.riderCommission)}
              </span>
            </div>
          </div>

          {/* Audit Event Timeline */}
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-3">
              Telemetry Event Timeline
            </span>

            <div className="relative pl-6 space-y-4 border-l-2 border-neutral-200 dark:border-neutral-800 ml-2">
              {order.timeline.map((evt) => (
                <div key={evt.id} className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-neutral-900" />
                  <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                    <span className="font-semibold text-neutral-900 dark:text-white">{evt.title}</span>
                    <span className="font-mono">{evt.timestamp}</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-300 mt-0.5">{evt.description}</p>
                  <span className="text-[10px] text-neutral-400 font-mono">By: {evt.actor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
