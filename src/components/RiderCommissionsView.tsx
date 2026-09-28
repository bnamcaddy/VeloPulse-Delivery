import React, { useState } from 'react';
import { DeliveryOrder, Rider } from '../types';
import { 
  DollarSign, 
  CheckCircle, 
  TrendingUp, 
  Award, 
  Calendar, 
  Wallet, 
  CreditCard, 
  ArrowUpRight,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { formatCurrency } from '../utils/logistics';
import { SoundEffects } from '../services/storageService';

interface RiderCommissionsViewProps {
  riders: Rider[];
  orders: DeliveryOrder[];
}

export const RiderCommissionsView: React.FC<RiderCommissionsViewProps> = ({
  riders,
  orders,
}) => {
  const [payoutStatus, setPayoutStatus] = useState<Record<string, 'pending' | 'approved'>>({});
  const [batchApproved, setBatchApproved] = useState(false);

  // Calculate earnings for each rider
  const riderEarnings = riders.map(rider => {
    const completedOrders = orders.filter(o => o.assignedRiderId === rider.id && o.status === 'delivered');
    const inTransitOrders = orders.filter(o => o.assignedRiderId === rider.id && (o.status === 'out_for_delivery' || o.status === 'in_transit' || o.status === 'picked_up'));

    const completedCommission = completedOrders.reduce((sum, o) => sum + o.riderCommission, 0);
    const inTransitCommission = inTransitOrders.reduce((sum, o) => sum + o.riderCommission, 0);
    const totalMileageKm = completedOrders.reduce((sum, o) => sum + o.distanceKm, 0);
    
    // Performance tier bonus (e.g. >95% on-time gives +$15.00 daily bonus)
    const onTimeBonus = rider.onTimeRate >= 98 ? 20.00 : rider.onTimeRate >= 95 ? 12.00 : 0;
    const totalEarned = completedCommission + onTimeBonus + rider.todayEarnings;

    return {
      rider,
      completedCount: completedOrders.length,
      inTransitCount: inTransitOrders.length,
      completedCommission,
      inTransitCommission,
      totalMileageKm,
      onTimeBonus,
      totalEarned,
      isApproved: batchApproved || payoutStatus[rider.id] === 'approved',
    };
  });

  const grandTotalCommission = riderEarnings.reduce((sum, r) => sum + r.totalEarned, 0);
  const totalApproved = riderEarnings.filter(r => r.isApproved).reduce((sum, r) => sum + r.totalEarned, 0);
  const totalPending = grandTotalCommission - totalApproved;

  const handleApproveRider = (riderId: string) => {
    setPayoutStatus(prev => ({ ...prev, [riderId]: 'approved' }));
    SoundEffects.playSuccessChime();
  };

  const handleApproveAll = () => {
    setBatchApproved(true);
    SoundEffects.playSuccessChime();
  };

  return (
    <div className="space-y-6">
      {/* Header & Overall Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-500" />
            <span>Rider Commissions & Payout Calculations</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Automated dispatch commissions, SLA milestone bonuses, and automated disbursement batches
          </p>
        </div>

        <button
          onClick={handleApproveAll}
          disabled={totalPending <= 0}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Approve All Pending Payouts ({formatCurrency(totalPending)})</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Total Accrued Commissions</span>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
            {formatCurrency(grandTotalCommission)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Base rate + Distance + Rush Multiplier
          </div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Approved for Payout</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalApproved)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Ready for instant bank ACH transfer
          </div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Pending Review</span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(totalPending)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Awaiting shift closure verification
          </div>
        </div>
      </div>

      {/* Commission Rules Reference Pill Strip */}
      <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-wrap items-center justify-between text-xs text-neutral-600 dark:text-neutral-300 gap-3">
        <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
          <Percent className="w-4 h-4 text-indigo-500" /> Commission Rules Matrix:
        </div>
        <div>Base: <span className="font-mono font-medium">$6.00 / drop</span></div>
        <div>Mileage: <span className="font-mono font-medium">$0.90 / km</span></div>
        <div>Rush Bonus: <span className="font-mono font-medium">+$4.50</span></div>
        <div>COD Collection: <span className="font-mono font-medium">+$1.50</span></div>
        <div>98%+ On-Time SLA: <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">+$20.00 / shift</span></div>
      </div>

      {/* Roster Payout Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 font-medium">
                <th className="py-3 px-4">Courier & Vehicle</th>
                <th className="py-3 px-4 text-center">Deliveries</th>
                <th className="py-3 px-4 text-center">SLA Rate</th>
                <th className="py-3 px-4 text-right">Distance Pay</th>
                <th className="py-3 px-4 text-right">Performance Bonus</th>
                <th className="py-3 px-4 text-right">Total Net Earnings</th>
                <th className="py-3 px-4 text-center">Disbursement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {riderEarnings.map(({ rider, completedCount, inTransitCount, totalMileageKm, onTimeBonus, totalEarned, isApproved }) => (
                <tr key={rider.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={rider.avatar}
                        alt={rider.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                      />
                      <div>
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          {rider.name}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {rider.vehiclePlate} · <span className="capitalize">{rider.vehicleType.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {rider.completedToday + completedCount}
                    </span>
                    {inTransitCount > 0 && (
                      <span className="text-[10px] text-blue-500 block">
                        (+{inTransitCount} in transit)
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {rider.onTimeRate}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-neutral-700 dark:text-neutral-300">
                    {formatCurrency(totalMileageKm * 0.90 + 24.50)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    +{formatCurrency(onTimeBonus)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-900 dark:text-white text-sm">
                    {formatCurrency(totalEarned)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApproveRider(rider.id)}
                        className="px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        Approve Payout
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
