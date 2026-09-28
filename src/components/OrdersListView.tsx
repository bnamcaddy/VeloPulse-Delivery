import React, { useState } from 'react';
import { DeliveryOrder, DeliveryStatus, Rider } from '../types';
import { 
  Package, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  ShieldCheck, 
  Truck, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  MoreHorizontal, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { formatCurrency, formatDateTime, exportOrdersToCSV } from '../utils/logistics';
import { SoundEffects } from '../services/storageService';

interface OrdersListViewProps {
  orders: DeliveryOrder[];
  riders: Rider[];
  onOpenCreateModal: () => void;
  onOpenAssignModal: (order: DeliveryOrder) => void;
  onOpenCodeModal: (order: DeliveryOrder) => void;
  onOpenNotificationDrawer: (order: DeliveryOrder) => void;
  onUpdateOrderStatus: (orderId: string, status: DeliveryStatus, reason?: any) => void;
  onSelectOrderDetails: (order: DeliveryOrder) => void;
}

export const OrdersListView: React.FC<OrdersListViewProps> = ({
  orders,
  riders,
  onOpenCreateModal,
  onOpenAssignModal,
  onOpenCodeModal,
  onOpenNotificationDrawer,
  onUpdateOrderStatus,
  onSelectOrderDetails,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_transit' | 'delivered' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Filtered dataset
  const filteredOrders = orders.filter(order => {
    // Tab filter
    if (activeTab === 'pending' && order.status !== 'pending' && order.status !== 'assigned') return false;
    if (activeTab === 'in_transit' && order.status !== 'picked_up' && order.status !== 'in_transit' && order.status !== 'out_for_delivery') return false;
    if (activeTab === 'delivered' && order.status !== 'delivered') return false;
    if (activeTab === 'failed' && order.status !== 'failed' && order.status !== 'returned') return false;

    // Priority filter
    if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTrack = order.trackingNumber.toLowerCase().includes(term);
      const matchRecip = order.recipientName.toLowerCase().includes(term);
      const matchSend = order.senderName.toLowerCase().includes(term);
      const matchAddr = order.deliveryAddress.toLowerCase().includes(term);
      if (!matchTrack && !matchRecip && !matchSend && !matchAddr) return false;
    }

    return true;
  });

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
            <Truck className="w-3 h-3" /> Out for Delivery
          </span>
        );
      case 'in_transit':
      case 'picked_up':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
            <Clock className="w-3 h-3" /> In Transit
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded">
            Assigned
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
            Pending Dispatch
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Dispatch Orders Ledger
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Monitor real-time delivery status, OTP validation codes, and rider assignments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportOrdersToCSV(orders)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm"
            title="Download CSV export"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm hover:shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Delivery Order</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Segmented Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Queue / Pending ({orders.filter(o => o.status === 'pending' || o.status === 'assigned').length})
          </button>
          <button
            onClick={() => setActiveTab('in_transit')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'in_transit'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            In-Transit ({orders.filter(o => o.status === 'out_for_delivery' || o.status === 'in_transit' || o.status === 'picked_up').length})
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'delivered'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Delivered ({orders.filter(o => o.status === 'delivered').length})
          </button>
          <button
            onClick={() => setActiveTab('failed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'failed'
                ? 'bg-white dark:bg-neutral-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Failed Drops ({orders.filter(o => o.status === 'failed' || o.status === 'returned').length})
          </button>
        </div>

        {/* Search & Priority Selector */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tracking, recipient..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 px-2.5 py-1.5 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent_sameday">Urgent Rush</option>
            <option value="express">Express</option>
            <option value="standard">Standard</option>
          </select>
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 font-medium">
                <th className="py-3 px-4">Tracking & Priority</th>
                <th className="py-3 px-4">Recipient & Dropoff</th>
                <th className="py-3 px-4">Assigned Courier</th>
                <th className="py-3 px-4 text-center">Security Code</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Fee / COD</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No deliveries match current filters</p>
                    <p className="text-xs mt-1">Try selecting another filter or dispatch a new order</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const assignedRider = riders.find(r => r.id === order.assignedRiderId);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrderDetails(order)}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors"
                    >
                      {/* Tracking # & Category */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-neutral-900 dark:text-white">
                            {order.trackingNumber}
                          </span>
                          {order.priority === 'urgent_sameday' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                              RUSH
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 capitalize mt-0.5">
                          {order.category.replace('_', ' ')} · {order.weightKg} kg
                        </div>
                      </td>

                      {/* Recipient & Address */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-neutral-900 dark:text-white">
                          {order.recipientName}
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate max-w-xs mt-0.5">
                          {order.deliveryAddress}
                        </div>
                      </td>

                      {/* Assigned Courier */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        {assignedRider ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={assignedRider.avatar}
                              alt={assignedRider.name}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
                            />
                            <div>
                              <div className="font-medium text-neutral-800 dark:text-neutral-200">
                                {assignedRider.name}
                              </div>
                              <button
                                onClick={() => onOpenAssignModal(order)}
                                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                Reassign
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenAssignModal(order)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-md transition-colors"
                          >
                            + Assign Rider
                          </button>
                        )}
                      </td>

                      {/* Security OTP Code */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenCodeModal(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono font-bold transition-colors"
                          title="View 6-digit OTP code & QR"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{order.deliveryCode}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Fee & COD */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          {formatCurrency(order.deliveryFee)}
                        </div>
                        {order.codAmount > 0 ? (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400">
                            COD: {formatCurrency(order.codAmount)}
                          </div>
                        ) : (
                          <div className="text-[10px] text-neutral-400">Prepaid</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenNotificationDrawer(order)}
                            className="p-1.5 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Send SMS / WhatsApp Alert"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectOrderDetails(order)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="View Timeline & Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
