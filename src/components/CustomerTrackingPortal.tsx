import React, { useState } from 'react';
import { DeliveryOrder, Rider } from '../types';
import { 
  Search, 
  Package, 
  MapPin, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare, 
  AlertCircle 
} from 'lucide-react';
import { formatCurrency, buildWhatsAppLink } from '../utils/logistics';

interface CustomerTrackingPortalProps {
  orders: DeliveryOrder[];
  riders: Rider[];
}

export const CustomerTrackingPortal: React.FC<CustomerTrackingPortalProps> = ({
  orders,
  riders,
}) => {
  const [trackingInput, setTrackingInput] = useState('VP-88210');
  const [searchedOrder, setSearchedOrder] = useState<DeliveryOrder | null>(
    orders.find(o => o.trackingNumber === 'VP-88210') || orders[0] || null
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = orders.find(o => 
      o.trackingNumber.toLowerCase() === trackingInput.trim().toLowerCase()
    );
    setSearchedOrder(found || null);
  };

  const assignedRider = searchedOrder ? riders.find(r => r.id === searchedOrder.assignedRiderId) : null;

  const steps = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'assigned', label: 'Courier Assigned' },
    { key: 'picked_up', label: 'Picked Up' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'assigned': return 1;
      case 'picked_up':
      case 'in_transit': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  };

  const currentStepIdx = searchedOrder ? getStepIndex(searchedOrder.status) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      {/* Search Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Track Your Delivery
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Enter your tracking code to view real-time courier GPS position and verification OTP
        </p>

        <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="e.g. VP-88210"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow transition-colors"
          >
            Track Parcel
          </button>
        </form>
      </div>

      {searchedOrder ? (
        <div className="space-y-4">
          {/* Main Status & Passcode Card */}
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                  Express Consignment
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                    {searchedOrder.trackingNumber}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold capitalize">
                    {searchedOrder.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-neutral-400">Destination</span>
                <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-xs">
                  {searchedOrder.deliveryAddress}
                </p>
              </div>
            </div>

            {/* Verification Passcode Banner for Recipient */}
            {searchedOrder.status !== 'delivered' && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 dark:border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500 text-neutral-950">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                      Your Delivery Passcode
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300">
                      Show this 6-digit code to courier upon arrival to verify delivery
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-500/40 font-mono text-2xl font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400 shadow-sm">
                  {searchedOrder.deliveryCode}
                </div>
              </div>
            )}

            {/* Stepper Progress Bar */}
            <div className="py-2">
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-neutral-100 dark:bg-neutral-800 z-0" />
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 z-0 transition-all duration-500" 
                  style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((st, i) => {
                  const isDone = i <= currentStepIdx;
                  return (
                    <div key={st.key} className="relative z-10 flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isDone
                          ? 'bg-emerald-500 text-neutral-950 ring-4 ring-white dark:ring-neutral-900 shadow'
                          : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'
                      }`}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span className={`text-[10px] mt-2 whitespace-nowrap hidden sm:block ${
                        isDone ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-400'
                      }`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assigned Courier Profile */}
            {assignedRider && (
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={assignedRider.avatar}
                    alt={assignedRider.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border border-neutral-300 dark:border-neutral-700"
                  />
                  <div>
                    <span className="text-[10px] text-neutral-400">Your Courier</span>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {assignedRider.name}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      {assignedRider.vehiclePlate} · ★ {assignedRider.rating} Rating
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${assignedRider.phone}`}
                    className="p-2 text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors shadow-sm"
                    title="Call Courier"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href={buildWhatsAppLink(
                      assignedRider.phone,
                      `Hello ${assignedRider.name}, I'm the recipient for package ${searchedOrder.trackingNumber}.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-emerald-600 hover:text-emerald-500 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors shadow-sm"
                    title="WhatsApp Courier"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">Package Not Found</h4>
          <p className="text-xs text-neutral-400 mt-1">
            Please verify the tracking number or try searching for <strong className="text-indigo-500">VP-88210</strong>.
          </p>
        </div>
      )}
    </div>
  );
};
