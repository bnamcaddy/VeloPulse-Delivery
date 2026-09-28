import React, { useState } from 'react';
import { DeliveryOrder, FailedReason, Rider } from '../types';
import { 
  AlertOctagon, 
  RotateCcw, 
  UserX, 
  MapPinOff, 
  CalendarClock, 
  ShieldAlert, 
  PhoneCall, 
  MessageSquare, 
  Truck, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, buildWhatsAppLink } from '../utils/logistics';
import { SoundEffects } from '../services/storageService';

interface FailedDeliveriesViewProps {
  orders: DeliveryOrder[];
  riders: Rider[];
  onRescheduleOrder: (orderId: string, newTime: string, notes: string) => void;
  onReassignOrder: (order: DeliveryOrder) => void;
  onReturnToDepot: (orderId: string, notes: string) => void;
}

export const FailedDeliveriesView: React.FC<FailedDeliveriesViewProps> = ({
  orders,
  riders,
  onRescheduleOrder,
  onReassignOrder,
  onReturnToDepot,
}) => {
  const failedOrders = orders.filter(o => o.status === 'failed' || o.status === 'returned');
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('2026-09-28T16:00');

  const getReasonLabel = (reason?: FailedReason) => {
    switch (reason) {
      case 'recipient_unavailable':
        return { label: 'Recipient Unavailable / No Answer', icon: UserX, color: 'text-amber-600 dark:text-amber-400' };
      case 'wrong_address':
        return { label: 'Incorrect Address / Missing Landmark', icon: MapPinOff, color: 'text-rose-600 dark:text-rose-400' };
      case 'rejected_cod':
        return { label: 'COD Payment Refused / Cash Insufficient', icon: ShieldAlert, color: 'text-rose-600 dark:text-rose-400' };
      case 'gate_access_denied':
        return { label: 'Security Gate / Intercom Access Denied', icon: AlertOctagon, color: 'text-amber-600 dark:text-amber-400' };
      default:
        return { label: 'Delivery Exception Logged', icon: AlertOctagon, color: 'text-neutral-500' };
    }
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    onRescheduleOrder(selectedOrder.id, rescheduleTime, rescheduleNotes);
    SoundEffects.playNotificationTone();
    setSelectedOrder(null);
    setRescheduleNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-500" />
            <span>Failed & Exception Deliveries Queue</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Resolve delivery exceptions, trigger customer outreach, and reschedule dropoff waves
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900">
            {failedOrders.length} Pending Exceptions
          </span>
        </div>
      </div>

      {/* Grid of Failed Orders */}
      {failedOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            Zero Delivery Exceptions!
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1">
            All dispatched parcels are either in transit or completed successfully with verified proof of delivery.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {failedOrders.map((order) => {
            const reasonInfo = getReasonLabel(order.failedReason);
            const ReasonIcon = reasonInfo.icon;
            const assignedRider = riders.find(r => r.id === order.assignedRiderId);

            return (
              <div
                key={order.id}
                className="p-5 rounded-xl border border-rose-200/80 dark:border-rose-950 bg-white dark:bg-neutral-900 shadow-sm space-y-4 hover:border-rose-300 transition-colors"
              >
                {/* Title & Reason */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                        {order.trackingNumber}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        {order.status === 'returned' ? 'RETURNED TO DEPOT' : 'FAILED ATTEMPT'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium mt-1.5 ${reasonInfo.color}`}>
                      <ReasonIcon className="w-3.5 h-3.5" />
                      <span>{reasonInfo.label}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="text-neutral-400">COD Due:</span>{' '}
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {formatCurrency(order.codAmount)}
                    </span>
                  </div>
                </div>

                {/* Recipient & Courier Notes */}
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300">
                    <span className="font-semibold">Recipient:</span>
                    <span>{order.recipientName} ({order.recipientPhone})</span>
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                    {order.deliveryAddress}
                  </div>
                  {order.failedNotes && (
                    <div className="text-rose-700 dark:text-rose-300 text-[11px] pt-1 border-t border-neutral-200 dark:border-neutral-700/60">
                      <span className="font-medium">Courier Note:</span> "{order.failedNotes}"
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <a
                    href={buildWhatsAppLink(
                      order.recipientPhone,
                      `Hello ${order.recipientName}, our courier attempted delivery for package ${order.trackingNumber} but could not reach you. Please let us know the best time to reattempt delivery today!`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Recipient</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onReassignOrder(order)}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      Reassign
                    </button>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>
                    <button
                      onClick={() => onReturnToDepot(order.id, 'Returned to sender via hub')}
                      className="px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      Return
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-indigo-500" />
              <span>Reschedule Delivery {selectedOrder.trackingNumber}</span>
            </h3>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                  New Delivery Window / SLA
                </label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                  Resolution / Dispatch Instructions
                </label>
                <textarea
                  rows={3}
                  required
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  placeholder="e.g. Recipient requested delivery between 4 PM - 6 PM at front lobby."
                  className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-xs text-neutral-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                >
                  Confirm Re-Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
