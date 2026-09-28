import React, { useState, useEffect } from 'react';
import { 
  Customer, 
  DeliveryOrder, 
  DeliveryStatus, 
  FailedReason, 
  MaintenanceAlert, 
  Rider, 
  UserRole 
} from './types';
import { StorageService, SoundEffects } from './services/storageService';
import { InteractiveFleetMap } from './components/InteractiveFleetMap';
import { OrdersListView } from './components/OrdersListView';
import { CustomersView } from './components/CustomersView';
import { CreateOrderModal } from './components/CreateOrderModal';
import { RiderAssignModal } from './components/RiderAssignModal';
import { DeliveryCodeModal } from './components/DeliveryCodeModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { FailedDeliveriesView } from './components/FailedDeliveriesView';
import { RiderCommissionsView } from './components/RiderCommissionsView';
import { ReportsAndAnalyticsView } from './components/ReportsAndAnalyticsView';
import { MaintenanceFleetView } from './components/MaintenanceFleetView';
import { RiderMobilePortal } from './components/RiderMobilePortal';
import { CustomerTrackingPortal } from './components/CustomerTrackingPortal';
import { OrderDetailDrawer } from './components/OrderDetailDrawer';
import { OfflineSyncEngine } from './components/OfflineSyncEngine';
import { 
  Truck, 
  Package, 
  Users, 
  AlertOctagon, 
  Wallet, 
  BarChart3, 
  Wrench, 
  Moon, 
  Sun, 
  Plus, 
  Smartphone, 
  ShieldCheck, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('velopulse_dark_mode') === 'true' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Role and Navigation
  const [currentRole, setCurrentRole] = useState<UserRole>('dispatcher');
  const [activeTab, setActiveTab] = useState<'map' | 'orders' | 'customers' | 'failed' | 'commissions' | 'reports' | 'maintenance'>('map');

  // Persistent Domain Data
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [riders, setRiders] = useState<Rider[]>(() => StorageService.getRiders());
  const [orders, setOrders] = useState<DeliveryOrder[]>(() => StorageService.getOrders());
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>(() => StorageService.getMaintenanceAlerts());
  const [expenses, setExpenses] = useState(() => StorageService.getExpenses());

  // Interactive Selection State
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Modals & Drawers
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [assignModalOrder, setAssignModalOrder] = useState<DeliveryOrder | null>(null);
  const [codeModalOrder, setCodeModalOrder] = useState<DeliveryOrder | null>(null);
  const [notificationDrawerOrder, setNotificationDrawerOrder] = useState<DeliveryOrder | null>(null);
  const [detailDrawerOrder, setDetailDrawerOrder] = useState<DeliveryOrder | null>(null);

  // Dark Mode side effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('velopulse_dark_mode', isDarkMode ? 'true' : 'false');
  }, [isDarkMode]);

  // Sync state changes to storage
  const handleSaveOrders = (newOrders: DeliveryOrder[]) => {
    setOrders(newOrders);
    StorageService.saveOrders(newOrders);
  };

  const handleSaveCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    StorageService.saveCustomers(newCustomers);
  };

  const handleSaveRiders = (newRiders: Rider[]) => {
    setRiders(newRiders);
    StorageService.saveRiders(newRiders);
  };

  const handleSaveMaintenance = (newAlerts: MaintenanceAlert[]) => {
    setMaintenanceAlerts(newAlerts);
    StorageService.saveMaintenanceAlerts(newAlerts);
  };

  // Create new order handler
  const handleCreateOrder = (newOrder: DeliveryOrder, notifyChannel?: 'sms' | 'whatsapp') => {
    const updatedOrders = [newOrder, ...orders];
    handleSaveOrders(updatedOrders);
    StorageService.enqueueSync('CREATE_ORDER', newOrder);

    // If order has an assigned rider, update rider status to 'delivering'
    if (newOrder.assignedRiderId) {
      const updatedRiders = riders.map(r => 
        r.id === newOrder.assignedRiderId ? { ...r, status: 'delivering' as const } : r
      );
      handleSaveRiders(updatedRiders);
    }
  };

  // Add customer handler
  const handleAddCustomer = (newCustomer: Customer) => {
    const updated = [newCustomer, ...customers];
    handleSaveCustomers(updated);
    StorageService.enqueueSync('REGISTER_CUSTOMER', newCustomer);
  };

  // Assign order to rider
  const handleAssignRider = (orderId: string, riderId: string) => {
    const targetRider = riders.find(r => r.id === riderId);
    if (!targetRider) return;

    const updatedOrders = orders.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: 'assigned' as DeliveryStatus,
          assignedRiderId: targetRider.id,
          assignedRiderName: targetRider.name,
          timeline: [
            ...ord.timeline,
            {
              id: 'tl-' + Date.now(),
              status: 'assigned' as DeliveryStatus,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              title: `Assigned to ${targetRider.name}`,
              description: `Route scheduled with vehicle ${targetRider.vehiclePlate}`,
              actor: 'Fleet Dispatcher',
            }
          ]
        };
      }
      return ord;
    });

    handleSaveOrders(updatedOrders);

    // Mark rider as delivering
    const updatedRiders = riders.map(r => 
      r.id === riderId ? { ...r, status: 'delivering' as const } : r
    );
    handleSaveRiders(updatedRiders);

    StorageService.enqueueSync('ASSIGN_RIDER', { orderId, riderId });
  };

  // Update order status
  const handleUpdateOrderStatus = (orderId: string, status: DeliveryStatus, reason?: FailedReason) => {
    const updatedOrders = orders.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status,
          failedReason: reason || ord.failedReason,
          completedAt: status === 'delivered' ? new Date().toISOString() : ord.completedAt,
          timeline: [
            ...ord.timeline,
            {
              id: 'tl-' + Date.now(),
              status,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              title: `Status set to ${status.replace('_', ' ').toUpperCase()}`,
              description: reason ? `Logged exception reason: ${reason}` : 'Updated via operator dashboard',
              actor: 'Console Operations',
            }
          ]
        };
      }
      return ord;
    });

    handleSaveOrders(updatedOrders);
    StorageService.enqueueSync('UPDATE_STATUS', { orderId, status, reason });
  };

  // Reschedule failed order
  const handleRescheduleOrder = (orderId: string, newTime: string, notes: string) => {
    const updatedOrders = orders.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: 'assigned' as DeliveryStatus,
          rescheduleDate: newTime,
          estimatedDeliveryTime: newTime,
          failedNotes: notes,
          timeline: [
            ...ord.timeline,
            {
              id: 'tl-' + Date.now(),
              status: 'assigned' as DeliveryStatus,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              title: 'Rescheduled for Re-Delivery',
              description: notes,
              actor: 'Exception Dispatcher',
            }
          ]
        };
      }
      return ord;
    });

    handleSaveOrders(updatedOrders);
    StorageService.enqueueSync('UPDATE_STATUS', { orderId, status: 'assigned', rescheduleDate: newTime });
  };

  // Return to Depot
  const handleReturnToDepot = (orderId: string, notes: string) => {
    handleUpdateOrderStatus(orderId, 'returned');
  };

  // Complete delivery via Rider Mobile Portal (verifies OTP)
  const handleCompleteDeliveryByRider = (
    orderId: string, 
    codeInput: string, 
    recipientSignName: string, 
    collectedCod?: number
  ): boolean => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    if (codeInput.trim() !== order.deliveryCode) {
      return false;
    }

    const updatedOrders = orders.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: 'delivered' as DeliveryStatus,
          paymentStatus: collectedCod ? 'cod_collected' as const : ord.paymentStatus,
          proofOfDelivery: {
            codeVerified: true,
            recipientSignName,
            completedAt: new Date().toISOString(),
            collectedCodAmount: collectedCod,
          },
          completedAt: new Date().toISOString(),
          timeline: [
            ...ord.timeline,
            {
              id: 'tl-' + Date.now(),
              status: 'delivered' as DeliveryStatus,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              title: 'Handoff Verified with 6-Digit Passcode',
              description: `Signed by ${recipientSignName}. ${collectedCod ? `COD Collected: $${collectedCod.toFixed(2)}` : 'Prepaid delivery verified.'}`,
              actor: ord.assignedRiderName || 'Courier',
            }
          ]
        };
      }
      return ord;
    });

    handleSaveOrders(updatedOrders);

    // Update rider metrics
    const updatedRiders = riders.map(r => {
      if (r.id === order.assignedRiderId) {
        return {
          ...r,
          completedToday: r.completedToday + 1,
          totalCompleted: r.totalCompleted + 1,
          todayEarnings: r.todayEarnings + order.riderCommission,
          status: 'available' as const,
        };
      }
      return r;
    });
    handleSaveRiders(updatedRiders);

    StorageService.enqueueSync('VERIFY_DELIVERY', { orderId, codeInput, recipientSignName });
    return true;
  };

  // Maintenance Handlers
  const handleAddMaintenance = (newAlert: MaintenanceAlert) => {
    const updated = [newAlert, ...maintenanceAlerts];
    handleSaveMaintenance(updated);
    StorageService.enqueueSync('LOG_MAINTENANCE', newAlert);
  };

  const handleResolveMaintenance = (alertId: string) => {
    const updated = maintenanceAlerts.map(a => 
      a.id === alertId ? { ...a, status: 'resolved' as const } : a
    );
    handleSaveMaintenance(updated);
  };

  // Log notifications
  const handleLogNotification = (
    orderId: string, 
    channel: 'sms' | 'whatsapp', 
    message: string, 
    title = 'Automated Dispatch'
  ) => {
    const updatedOrders = orders.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          notifications: [
            ...ord.notifications,
            {
              id: 'notif-' + Date.now(),
              channel,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              recipient: ord.recipientPhone,
              title,
              message,
              status: 'delivered' as const,
            }
          ]
        };
      }
      return ord;
    });
    handleSaveOrders(updatedOrders);
  };

  // Update rider live coordinate simulation
  const handleUpdateRiderCoordinates = (
    riderId: string, 
    coords: { lat: number; lng: number }, 
    heading: number
  ) => {
    setRiders(prev => prev.map(r => 
      r.id === riderId ? { ...r, coordinates: coords, headingDeg: heading } : r
    ));
  };

  // Count active exceptions
  const failedCount = orders.filter(o => o.status === 'failed' || o.status === 'returned').length;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0b101b] text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* Universal Top Bar Contract: Zone 1 (Wordmark), Zone 2 (4-6 Clean Nav Links), Zone 3 (Primary Actions & Roles) */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0b101b]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Zone 1: Single Wordmark Brand Text */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
              <Truck className="w-4 h-4" />
            </div>
            <a href="/" className="text-base font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
              VeloPulse Logistics
            </a>
          </div>

          {/* Zone 2: Navigation Links */}
          {currentRole !== 'rider' && currentRole !== 'customer' && (
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'map'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Fleet Live Map
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Dispatch Orders ({orders.length})
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'customers'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Customer Directory
              </button>

              <button
                onClick={() => setActiveTab('failed')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'failed'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-rose-600 dark:text-rose-400 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <span>Exceptions</span>
                {failedCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('commissions')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'commissions'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Commissions
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'reports'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Analytics & Reports
              </button>

              <button
                onClick={() => setActiveTab('maintenance')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'maintenance'
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Fleet Health
              </button>
            </nav>
          )}

          {/* Zone 3: Actions, Offline Sync, Role Switcher, Dark Mode */}
          <div className="flex items-center gap-2.5">
            {/* Offline Sync Engine Pill */}
            <OfflineSyncEngine 
              onSyncCompleted={() => {
                setOrders(StorageService.getOrders());
                setCustomers(StorageService.getCustomers());
              }} 
            />

            {/* Role Switcher */}
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 py-1.5 px-2.5 outline-none font-medium shadow-sm"
              title="Switch RBAC Security Role"
            >
              <option value="dispatcher">Dispatcher (Operations HQ)</option>
              <option value="fleet_manager">Fleet Maintenance Manager</option>
              <option value="rider">Rider / Courier (Mobile Portal)</option>
              <option value="customer">Customer Public Tracking</option>
            </select>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Primary Action Button */}
            {currentRole !== 'customer' && currentRole !== 'rider' && (
              <button
                onClick={() => setIsCreateOrderModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Delivery</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row (under 1024px) */}
        {currentRole !== 'rider' && currentRole !== 'customer' && (
          <div className="lg:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'map' ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Live Map
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'orders' ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'customers' ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setActiveTab('failed')}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'failed' ? 'bg-neutral-200 dark:bg-neutral-800 text-rose-500' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Exceptions ({failedCount})
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'commissions' ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Commissions
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'reports' ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
                activeTab === 'maintenance' ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Fleet Health
            </button>
          </div>
        )}
      </header>

      {/* Main Content Workspace Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {/* Role View 1: Rider Mobile Portal */}
        {currentRole === 'rider' && (
          <RiderMobilePortal
            currentRider={riders[0]}
            orders={orders}
            onCompleteDelivery={handleCompleteDeliveryByRider}
            onUpdateStatus={(orderId, status, reasonNotes) => {
              handleUpdateOrderStatus(orderId, status);
            }}
          />
        )}

        {/* Role View 2: Customer Public Tracking Portal */}
        {currentRole === 'customer' && (
          <CustomerTrackingPortal
            orders={orders}
            riders={riders}
          />
        )}

        {/* Role View 3 & 4: Dispatcher / Operations HQ */}
        {currentRole !== 'rider' && currentRole !== 'customer' && (
          <div className="space-y-6">
            {activeTab === 'map' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                      Real-Time Fleet Telemetry & Dispatch Map
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Live GPS couriers on duty, automated route polylines, and delivery dropoff pins
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsCreateOrderModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Dispatch Order</span>
                    </button>
                  </div>
                </div>

                {/* Interactive Map */}
                <InteractiveFleetMap
                  riders={riders}
                  orders={orders}
                  selectedRiderId={selectedRiderId}
                  onSelectRider={setSelectedRiderId}
                  selectedOrderId={selectedOrderId}
                  onSelectOrder={setSelectedOrderId}
                  onAssignOrderModal={(order) => setAssignModalOrder(order)}
                  onUpdateRiderCoordinates={handleUpdateRiderCoordinates}
                />
              </div>
            )}

            {activeTab === 'orders' && (
              <OrdersListView
                orders={orders}
                riders={riders}
                onOpenCreateModal={() => setIsCreateOrderModalOpen(true)}
                onOpenAssignModal={(order) => setAssignModalOrder(order)}
                onOpenCodeModal={(order) => setCodeModalOrder(order)}
                onOpenNotificationDrawer={(order) => setNotificationDrawerOrder(order)}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onSelectOrderDetails={(order) => setDetailDrawerOrder(order)}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                customers={customers}
                orders={orders}
                onAddCustomer={handleAddCustomer}
              />
            )}

            {activeTab === 'failed' && (
              <FailedDeliveriesView
                orders={orders}
                riders={riders}
                onRescheduleOrder={handleRescheduleOrder}
                onReassignOrder={(order) => setAssignModalOrder(order)}
                onReturnToDepot={handleReturnToDepot}
              />
            )}

            {activeTab === 'commissions' && (
              <RiderCommissionsView
                riders={riders}
                orders={orders}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsAndAnalyticsView
                orders={orders}
                riders={riders}
                expenses={expenses}
              />
            )}

            {activeTab === 'maintenance' && (
              <MaintenanceFleetView
                alerts={maintenanceAlerts}
                riders={riders}
                onAddMaintenance={handleAddMaintenance}
                onResolveMaintenance={handleResolveMaintenance}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals & Overlays */}
      <CreateOrderModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => setIsCreateOrderModalOpen(false)}
        customers={customers}
        riders={riders}
        onCreateOrder={handleCreateOrder}
      />

      <RiderAssignModal
        isOpen={!!assignModalOrder}
        onClose={() => setAssignModalOrder(null)}
        order={assignModalOrder}
        riders={riders}
        onAssign={handleAssignRider}
      />

      <DeliveryCodeModal
        isOpen={!!codeModalOrder}
        onClose={() => setCodeModalOrder(null)}
        order={codeModalOrder}
        onLogNotification={handleLogNotification}
      />

      <NotificationDrawer
        isOpen={!!notificationDrawerOrder}
        onClose={() => setNotificationDrawerOrder(null)}
        order={notificationDrawerOrder}
        onSendNotification={(orderId, channel, message, title) => {
          handleLogNotification(orderId, channel, message, title);
        }}
      />

      <OrderDetailDrawer
        order={detailDrawerOrder}
        riders={riders}
        onClose={() => setDetailDrawerOrder(null)}
        onUpdateStatus={handleUpdateOrderStatus}
        onOpenAssignModal={(order) => {
          setDetailDrawerOrder(null);
          setAssignModalOrder(order);
        }}
        onOpenCodeModal={(order) => {
          setDetailDrawerOrder(null);
          setCodeModalOrder(order);
        }}
        onOpenNotificationDrawer={(order) => {
          setDetailDrawerOrder(null);
          setNotificationDrawerOrder(order);
        }}
      />
    </div>
  );
}
