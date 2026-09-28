import React, { useState } from 'react';
import { DeliveryOrder, Rider } from '../types';
import { 
  Navigation, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Clock, 
  Bike, 
  Battery, 
  Zap, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency, buildWhatsAppLink } from '../utils/logistics';
import { SoundEffects } from '../services/storageService';

interface RiderMobilePortalProps {
  currentRider: Rider;
  orders: DeliveryOrder[];
  onCompleteDelivery: (orderId: string, codeInput: string, recipientName: string, collectedCod?: number) => boolean;
  onUpdateStatus: (orderId: string, status: 'picked_up' | 'in_transit' | 'out_for_delivery' | 'failed', reasonNotes?: string) => void;
}

export const RiderMobilePortal: React.FC<RiderMobilePortalProps> = ({
  currentRider,
  orders,
  onCompleteDelivery,
  onUpdateStatus,
}) => {
  // Filter rider's assigned orders
  const myOrders = orders.filter(o => o.assignedRiderId === currentRider.id);
  const activeOrder = myOrders.find(o => o.status !== 'delivered' && o.status !== 'failed' && o.status !== 'returned') || myOrders[0];

  const [otpInput, setOtpInput] = useState('');
  const [recipientSignName, setRecipientSignName] = useState('');
  const [codCollected, setCodCollected] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [successNotice, setSuccessNotice] = useState(false);

  const handleVerifyHandoff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    if (otpInput.trim() !== activeOrder.deliveryCode) {
      setOtpError('Invalid 6-digit code! Customer must provide the OTP from their SMS/WhatsApp alert.');
      SoundEffects.playAlertTone();
      return;
    }

    const codAmount = activeOrder.codAmount > 0 && codCollected ? activeOrder.codAmount : undefined;
    const ok = onCompleteDelivery(activeOrder.id, otpInput, recipientSignName || activeOrder.recipientName, codAmount);

    if (ok) {
      setOtpError('');
      setSuccessNotice(true);
      SoundEffects.playSuccessChime();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        setSuccessNotice(false);
        setOtpInput('');
        setRecipientSignName('');
      }, 3500);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12 animate-in fade-in">
      {/* Mobile Top Rider Status Card */}
      <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={currentRider.avatar} 
              alt={currentRider.name} 
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500/50" 
            />
            <div>
              <h3 className="font-bold text-sm text-white">{currentRider.name}</h3>
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                <span>{currentRider.vehiclePlate}</span>
                <span>·</span>
                <span className="capitalize">{currentRider.vehicleType.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-neutral-400">Shift Earnings</span>
            <div className="text-lg font-mono font-bold text-emerald-400">
              {formatCurrency(currentRider.todayEarnings)}
            </div>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800 text-center text-xs">
          <div className="p-2 rounded-xl bg-neutral-800/60">
            <span className="text-neutral-400 block text-[10px]">Battery</span>
            <span className="font-mono font-semibold text-emerald-400 flex items-center justify-center gap-1">
              <Battery className="w-3.5 h-3.5" /> {currentRider.batteryOrFuelLevel}%
            </span>
          </div>
          <div className="p-2 rounded-xl bg-neutral-800/60">
            <span className="text-neutral-400 block text-[10px]">Delivered</span>
            <span className="font-mono font-semibold text-white">
              {currentRider.completedToday} Drops
            </span>
          </div>
          <div className="p-2 rounded-xl bg-neutral-800/60">
            <span className="text-neutral-400 block text-[10px]">On-Time SLA</span>
            <span className="font-mono font-semibold text-indigo-400">
              {currentRider.onTimeRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Success Celebration Card */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-neutral-950 font-medium text-center shadow-xl animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-neutral-950" />
          <h4 className="font-bold text-base">Handoff Confirmed!</h4>
          <p className="text-xs text-neutral-900 mt-0.5">
            Proof of delivery recorded & payout added to your daily wallet.
          </p>
        </div>
      )}

      {/* Active Parcel Assignment Cockpit */}
      {activeOrder && activeOrder.status !== 'delivered' ? (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md overflow-hidden">
          {/* Status Header */}
          <div className="px-5 py-3.5 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-indigo-900 dark:text-indigo-200">
                {activeOrder.trackingNumber}
              </span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-300">
                {activeOrder.status.replace('_', ' ')}
              </span>
            </div>
            <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(activeOrder.riderCommission)}
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Recipient & Location */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Dropoff Destination
              </span>
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                {activeOrder.recipientName}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{activeOrder.deliveryAddress}</span>
              </p>
              {activeOrder.deliveryNotes && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 mt-2">
                  <span className="font-semibold">Note:</span> {activeOrder.deliveryNotes}
                </div>
              )}
            </div>

            {/* Turn-by-Turn GPS Navigation & Call */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(activeOrder.deliveryAddress)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm"
              >
                <Navigation className="w-4 h-4" />
                <span>Open Google Maps</span>
              </a>

              <a
                href={`tel:${activeOrder.recipientPhone}`}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>Call Customer</span>
              </a>
            </div>

            {/* Transition Status Buttons */}
            {activeOrder.status === 'assigned' && (
              <button
                onClick={() => onUpdateStatus(activeOrder.id, 'picked_up')}
                className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow"
              >
                Scan & Confirm Pickup from Sender
              </button>
            )}

            {activeOrder.status === 'picked_up' && (
              <button
                onClick={() => onUpdateStatus(activeOrder.id, 'out_for_delivery')}
                className="w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow"
              >
                Start Delivery (Notify Customer)
              </button>
            )}

            {/* Proof of Delivery OTP Verification Form */}
            <form onSubmit={handleVerifyHandoff} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 space-y-3">
              <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Customer Verification & Handover</span>
              </div>

              <div>
                <label className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1">
                  Enter Customer's 6-Digit Delivery Code:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 492810"
                  className="w-full text-center tracking-widest text-lg font-mono font-bold py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {otpError && (
                <div className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {/* Cash-on-Delivery Collection Toggle */}
              {activeOrder.codAmount > 0 && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-900 dark:text-amber-200">
                    <input
                      type="checkbox"
                      checked={codCollected}
                      onChange={(e) => setCodCollected(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>Collected COD Cash: {formatCurrency(activeOrder.codAmount)}</span>
                  </label>
                </div>
              )}

              <div>
                <label className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1">
                  Recipient Signature Name (Optional)
                </label>
                <input
                  type="text"
                  value={recipientSignName}
                  onChange={(e) => setRecipientSignName(e.target.value)}
                  placeholder={activeOrder.recipientName}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Code & Complete Delivery</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">All Assigned Parcels Completed!</h4>
          <p className="text-xs text-neutral-500 mt-1">
            Stand by for new route dispatches from Central Fleet Operations.
          </p>
        </div>
      )}
    </div>
  );
};
