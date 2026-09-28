import React, { useState } from 'react';
import { DeliveryOrder, Rider } from '../types';
import { 
  X, 
  Truck, 
  Battery, 
  Star, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Bike 
} from 'lucide-react';
import { SoundEffects } from '../services/storageService';

interface RiderAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: DeliveryOrder | null;
  riders: Rider[];
  onAssign: (orderId: string, riderId: string) => void;
}

export const RiderAssignModal: React.FC<RiderAssignModalProps> = ({
  isOpen,
  onClose,
  order,
  riders,
  onAssign,
}) => {
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');

  if (!isOpen || !order) return null;

  const handleConfirm = () => {
    if (!selectedRiderId) return;
    onAssign(order.id, selectedRiderId);
    SoundEffects.playNotificationTone();
    onClose();
  };

  // Sort riders by availability and rating
  const sortedRiders = [...riders].sort((a, b) => {
    if (a.status === 'available' && b.status !== 'available') return -1;
    if (a.status !== 'available' && b.status === 'available') return 1;
    return b.rating - a.rating;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Dispatch Courier Assignment
              </h3>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400">
                {order.trackingNumber}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Select active rider for {order.category} parcel to {order.recipientName}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Quick Specs */}
        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
            <span className="truncate max-w-[220px]">{order.deliveryAddress}</span>
          </div>
          <div className="font-mono font-medium text-neutral-900 dark:text-white">
            Weight: {order.weightKg}kg · Commission: ${order.riderCommission.toFixed(2)}
          </div>
        </div>

        {/* Riders Roster */}
        <div className="p-6 max-h-80 overflow-y-auto space-y-2.5">
          {sortedRiders.map((rider) => {
            const isSelected = selectedRiderId === rider.id;
            const isCurrent = order.assignedRiderId === rider.id;

            return (
              <div
                key={rider.id}
                onClick={() => setSelectedRiderId(rider.id)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={rider.avatar} 
                      alt={rider.name} 
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700" 
                    />
                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white dark:border-neutral-900" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                        {rider.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {rider.vehiclePlate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      <span className="capitalize">{rider.vehicleType.replace('_', ' ')}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-500" /> {rider.rating}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Battery className="w-3 h-3" /> {rider.batteryOrFuelLevel}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                    rider.status === 'available'
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                      : rider.status === 'delivering'
                      ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                  }`}>
                    {rider.status}
                  </span>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    {rider.completedToday} drops today
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {selectedRiderId ? 'Ready to dispatch' : 'Select a courier above'}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedRiderId}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>Confirm Assignment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
