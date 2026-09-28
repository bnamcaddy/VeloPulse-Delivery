import React, { useState } from 'react';
import { Customer, DeliveryOrder, DeliveryPriority, ParcelCategory, Rider } from '../types';
import { 
  X, 
  Package, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Truck, 
  User, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';
import { 
  calculateDeliveryPricing, 
  formatCurrency, 
  generateDeliveryCode, 
  generateTrackingNumber 
} from '../utils/logistics';
import { SoundEffects } from '../services/storageService';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  riders: Rider[];
  onCreateOrder: (newOrder: DeliveryOrder, notifyChannel?: 'sms' | 'whatsapp') => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  customers,
  riders,
  onCreateOrder,
}) => {
  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [customSender, setCustomSender] = useState(false);
  const [senderName, setSenderName] = useState(customers[0]?.name || '');
  const [senderPhone, setSenderPhone] = useState(customers[0]?.phone || '');
  const [pickupAddress, setPickupAddress] = useState(customers[0]?.address || '');

  // Recipient
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Specs
  const [category, setCategory] = useState<ParcelCategory>('standard_box');
  const [weightKg, setWeightKg] = useState<number>(2.5);
  const [priority, setPriority] = useState<DeliveryPriority>('standard');
  const [isCod, setIsCod] = useState<boolean>(false);
  const [codAmount, setCodAmount] = useState<number>(0);
  const [declaredValue, setDeclaredValue] = useState<number>(100);

  // Dispatch Assignment
  const [assignedRiderId, setAssignedRiderId] = useState<string>('auto');
  const [notifyCustomer, setNotifyCustomer] = useState<'both' | 'whatsapp' | 'sms' | 'none'>('both');

  // Error feedback
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  // Selected existing customer update
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      setSenderName(cust.name + (cust.company ? ` (${cust.company})` : ''));
      setSenderPhone(cust.phone);
      setPickupAddress(`${cust.address}, ${cust.city}`);
    }
  };

  // Real-time distance simulation
  const simulatedDistanceKm = Math.round((2.5 + Math.random() * 5.5) * 10) / 10;
  const pricing = calculateDeliveryPricing(
    simulatedDistanceKm,
    weightKg,
    priority,
    category,
    isCod && codAmount > 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientPhone.trim() || !deliveryAddress.trim()) {
      setErrorMsg('Please enter recipient name, contact phone, and dropoff address.');
      return;
    }

    const trackingNumber = generateTrackingNumber();
    const deliveryCode = generateDeliveryCode();

    // Coordinates generation around SF metro
    const pickupCoords = {
      lat: 37.7749 + (Math.random() - 0.5) * 0.04,
      lng: -122.4194 + (Math.random() - 0.5) * 0.04,
    };
    const deliveryCoords = {
      lat: 37.7749 + (Math.random() - 0.5) * 0.05,
      lng: -122.4194 + (Math.random() - 0.5) * 0.05,
    };

    // Determine Rider
    let finalRiderId: string | undefined = undefined;
    let finalRiderName: string | undefined = undefined;

    if (assignedRiderId === 'auto') {
      const available = riders.find(r => r.status === 'available') || riders[0];
      if (available) {
        finalRiderId = available.id;
        finalRiderName = available.name;
      }
    } else if (assignedRiderId !== 'unassigned') {
      const selectedRider = riders.find(r => r.id === assignedRiderId);
      if (selectedRider) {
        finalRiderId = selectedRider.id;
        finalRiderName = selectedRider.name;
      }
    }

    const now = new Date();
    const estDate = new Date(now.getTime() + pricing.estimatedMinutes * 60000);

    const newOrder: DeliveryOrder = {
      id: 'ord-' + Date.now(),
      trackingNumber,
      deliveryCode,
      qrPayload: `VP-POD-${trackingNumber}-${deliveryCode}`,
      senderId: selectedCustomerId || undefined,
      senderName,
      senderPhone,
      pickupAddress,
      pickupCity: 'San Francisco, CA',
      pickupCoordinates: pickupCoords,
      recipientName,
      recipientPhone,
      deliveryAddress,
      deliveryCity: 'San Francisco, CA',
      deliveryCoordinates: deliveryCoords,
      deliveryNotes: deliveryNotes || undefined,
      category,
      weightKg,
      priority,
      declaredValue,
      codAmount: isCod ? codAmount : 0,
      paymentStatus: isCod ? 'cod_pending' : 'prepaid',
      deliveryFee: pricing.deliveryFee,
      riderCommission: pricing.riderCommission,
      distanceKm: pricing.estimatedDistanceKm,
      status: finalRiderId ? 'assigned' : 'pending',
      assignedRiderId: finalRiderId,
      assignedRiderName: finalRiderName,
      createdAt: now.toISOString(),
      estimatedDeliveryTime: estDate.toISOString(),
      timeline: [
        {
          id: 'tl-' + Date.now(),
          status: 'pending',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          title: 'Order Created',
          description: `Delivery ticket generated for ${recipientName}`,
          actor: 'Operations Dispatcher',
        },
        ...(finalRiderName ? [{
          id: 'tl-' + (Date.now() + 1),
          status: 'assigned' as const,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          title: 'Courier Assigned',
          description: `Dispatched to ${finalRiderName}`,
          actor: 'Smart Dispatch Engine',
        }] : [])
      ],
      notifications: [
        {
          id: 'notif-' + Date.now(),
          channel: notifyCustomer === 'whatsapp' ? 'whatsapp' : 'sms',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recipient: recipientPhone,
          title: 'Order Scheduled',
          message: `Your package ${trackingNumber} has been scheduled for delivery! Verification code: ${deliveryCode}.`,
          status: 'delivered',
        }
      ],
    };

    SoundEffects.playNotificationTone();
    onCreateOrder(newOrder, notifyCustomer === 'none' ? undefined : 'whatsapp');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                Create Delivery Order
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Dispatch express shipment, calculate rider payout & generate verification code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Sender & Origin */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Sender & Pickup Origin
              </label>
              <button
                type="button"
                onClick={() => setCustomSender(!customSender)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                {customSender ? 'Select Registered Client' : '+ Custom Sender'}
              </button>
            </div>

            {!customSender ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                    Registered Client
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                    Pickup Address
                  </label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Sender Full Name / Co."
                    className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                    Sender Phone
                  </label>
                  <input
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                    Pickup Address
                  </label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Street, Suite, SF"
                    className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Recipient Details */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Recipient & Dropoff Location
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Dr. Julian Vance"
                  className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                  Recipient Phone (For SMS/WhatsApp OTP) *
                </label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+1 (555) 789-0123"
                  className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                  Delivery Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. 500 Howard St, Apt 804"
                  className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                  Delivery Gate / Unit Notes
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Intercom #804, ring bell"
                  className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3 py-2 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Parcel Specs & Pricing Factors */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> Parcel Parameters & Priority
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ParcelCategory)}
                  className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 capitalize outline-none"
                >
                  <option value="standard_box">Standard Box</option>
                  <option value="documents">Secure Documents</option>
                  <option value="fragile">Fragile / Glass</option>
                  <option value="perishable">Perishable / Cold</option>
                  <option value="express_packet">Express Packet</option>
                  <option value="oversize">Oversize Cargo</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                  Weight ({weightKg} kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="45"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0.5)}
                  className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                  Priority SLA
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as DeliveryPriority)}
                  className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 capitalize outline-none"
                >
                  <option value="standard">Standard (3-4 hrs)</option>
                  <option value="express">Express (90 mins)</option>
                  <option value="urgent_sameday">Urgent Rush (45 mins)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                  Declared Value ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none font-mono"
                />
              </div>
            </div>

            {/* Cash on Delivery (COD) Options */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/60 flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-800 dark:text-neutral-200">
                <input
                  type="checkbox"
                  checked={isCod}
                  onChange={(e) => setIsCod(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Collect Cash on Delivery (COD)</span>
              </label>

              {isCod && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Amount Due:</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-neutral-400">$</span>
                    <input
                      type="number"
                      min="1"
                      value={codAmount}
                      onChange={(e) => setCodAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-28 text-xs pl-6 pr-2 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Dispatcher Assignment & Notifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Fleet Assignment
              </label>
              <select
                value={assignedRiderId}
                onChange={(e) => setAssignedRiderId(e.target.value)}
                className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
              >
                <option value="auto">✨ Smart Auto-Dispatch (Nearest Optimal)</option>
                <option value="unassigned">Hold in Unassigned Queue</option>
                {riders.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.vehiclePlate}) · {r.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">
                Instant Notification Trigger
              </label>
              <select
                value={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.value as any)}
                className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
              >
                <option value="both">Send SMS & WhatsApp (with OTP Code)</option>
                <option value="whatsapp">WhatsApp Alert Only</option>
                <option value="sms">SMS Text Alert Only</option>
                <option value="none">No Automated Alert</option>
              </select>
            </div>
          </div>

          {/* Pricing Breakdown Summary Bar */}
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Total Delivery Fee</span>
              <div className="text-xl font-bold font-mono text-indigo-900 dark:text-indigo-200">
                {formatCurrency(pricing.deliveryFee)}
              </div>
            </div>
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Rider Commission Pool</span>
              <div className="text-base font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(pricing.riderCommission)}
              </div>
            </div>
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Estimated Transit</span>
              <div className="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                ~{pricing.estimatedMinutes} mins ({pricing.estimatedDistanceKm} km)
              </div>
            </div>
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Security Verification</span>
              <div className="text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Auto 6-digit OTP
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 rounded-lg shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate Order & Dispatch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
