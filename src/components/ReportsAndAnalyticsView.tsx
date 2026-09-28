import React, { useState } from 'react';
import { DeliveryOrder, ExpenseRecord, Rider } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  FileSpreadsheet, 
  Award, 
  Clock, 
  Percent, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  Truck
} from 'lucide-react';
import { formatCurrency, exportOrdersToCSV } from '../utils/logistics';

interface ReportsAndAnalyticsViewProps {
  orders: DeliveryOrder[];
  riders: Rider[];
  expenses: ExpenseRecord[];
}

export const ReportsAndAnalyticsView: React.FC<ReportsAndAnalyticsViewProps> = ({
  orders,
  riders,
  expenses,
}) => {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');

  // Delivery metrics
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const failedOrders = orders.filter(o => o.status === 'failed' || o.status === 'returned');
  const inTransitOrders = orders.filter(o => o.status === 'in_transit' || o.status === 'out_for_delivery' || o.status === 'picked_up');

  const deliverySuccessRate = totalOrders > 0 
    ? Math.round((deliveredOrders.length / (totalOrders - inTransitOrders.length || 1)) * 100) 
    : 100;

  // Financials
  const grossRevenue = orders.reduce((sum, o) => sum + o.deliveryFee, 0) + (timeframe === 'month' ? 14200 : timeframe === 'week' ? 4180 : 0);
  const riderPayoutTotal = orders.reduce((sum, o) => sum + o.riderCommission, 0) + (timeframe === 'month' ? 6200 : timeframe === 'week' ? 1800 : 0);
  const operatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0) + (timeframe === 'month' ? 3400 : timeframe === 'week' ? 950 : 0);
  const totalCost = riderPayoutTotal + operatingExpenses;
  const netMargin = grossRevenue - totalCost;
  const netMarginPercent = grossRevenue > 0 ? Math.round((netMargin / grossRevenue) * 100) : 0;

  // Chart data: hourly delivery volume
  const volumeData = [
    { label: '07:00', orders: 4, revenue: 112 },
    { label: '08:00', orders: 9, revenue: 245 },
    { label: '09:00', orders: 14, revenue: 390 },
    { label: '10:00', orders: 18, revenue: 520 },
    { label: '11:00', orders: 22, revenue: 640 },
    { label: '12:00', orders: 16, revenue: 470 },
    { label: '13:00', orders: 19, revenue: 580 },
    { label: '14:00', orders: 12, revenue: 360 },
  ];

  const maxVolume = Math.max(...volumeData.map(d => d.orders), 25);

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span>Reports, Revenue & Fleet Analytics</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Operational SLA throughput, expense breakdown, and courier performance leaderboards
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeframe === 'today'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeframe === 'week'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                timeframe === 'month'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              This Month
            </button>
          </div>

          <button
            onClick={() => exportOrdersToCSV(orders)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export Report (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Gross Delivery Revenue</span>
            <span className="text-emerald-500 flex items-center font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
            {formatCurrency(grossRevenue)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Delivery charges & COD collection fees
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Total Operational Expenses</span>
            <span className="text-rose-500 flex items-center font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.2%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(totalCost)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Commissions ({formatCurrency(riderPayoutTotal)}) + Ops & Fuel
          </div>
        </div>

        {/* Net Profit Margin */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Net Operating Margin</span>
            <span className="text-emerald-500 font-mono font-medium">
              {netMarginPercent}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(netMargin)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Retained logistics EBITDA profit
          </div>
        </div>

        {/* First-Attempt SLA Success */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>First-Attempt SLA Rate</span>
            <span className="text-indigo-500 font-mono font-medium">Target: 95%</span>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {deliverySuccessRate}%
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {deliveredOrders.length} completed drops · {failedOrders.length} exceptions
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Hourly Volume & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Volume Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Dispatch Volume Throughput (Hourly Wave)
              </h3>
              <p className="text-xs text-neutral-400">
                Number of parcels dispatched per operational hour
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-500">
              Peak: 11:00 AM (22 drops)
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
            {volumeData.map((bar, i) => {
              const heightPercent = Math.round((bar.orders / maxVolume) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {bar.orders} pkgs
                  </div>
                  <div className="w-full max-w-[42px] bg-neutral-100 dark:bg-neutral-800 rounded-t-lg overflow-hidden flex items-end">
                    <div
                      className="w-full bg-indigo-500 hover:bg-indigo-400 transition-all rounded-t-lg"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Breakdown Categories */}
        <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Operational Cost Distribution
          </h3>

          <div className="space-y-3 pt-1">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-600 dark:text-neutral-300">Rider Commissions (Direct)</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-white">56%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '56%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-600 dark:text-neutral-300">EV Charging & Fuel Depot</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-white">18%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '18%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-600 dark:text-neutral-300">Fleet Maintenance & Parts</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-white">14%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '14%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-600 dark:text-neutral-300">SMS / WhatsApp Telecom</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-white">7%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '7%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-600 dark:text-neutral-300">Insurance & Software</span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-white">5%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '5%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Performance Leaderboard */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Fleet Efficiency & Driver Performance Leaderboard</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Ranked by on-time completion rate, customer satisfaction rating, and safety compliance
            </p>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            {riders.length} Active Couriers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 font-medium">
                <th className="py-3 px-4">Rank & Courier</th>
                <th className="py-3 px-4">Vehicle Mode</th>
                <th className="py-3 px-4 text-center">Deliveries Today</th>
                <th className="py-3 px-4 text-center">On-Time SLA</th>
                <th className="py-3 px-4 text-center">Customer Rating</th>
                <th className="py-3 px-4 text-right">Commission Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {[...riders].sort((a, b) => b.onTimeRate - a.onTimeRate).map((rider, index) => (
                <tr key={rider.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[11px] ${
                        index === 0 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                          : index === 1
                          ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}>
                        #{index + 1}
                      </span>
                      <img
                        src={rider.avatar}
                        alt={rider.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
                      />
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        {rider.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-neutral-600 dark:text-neutral-300 capitalize">
                    {rider.vehicleType.replace('_', ' ')}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-neutral-900 dark:text-white">
                    {rider.completedToday}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {rider.onTimeRate}%
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-amber-500 font-semibold">
                    ★ {rider.rating.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-neutral-900 dark:text-white">
                    {formatCurrency(rider.todayEarnings)}
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
