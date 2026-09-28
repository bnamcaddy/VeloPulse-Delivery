export type UserRole = 'admin' | 'dispatcher' | 'fleet_manager' | 'rider' | 'customer';

export type ParcelCategory = 
  | 'standard_box' 
  | 'documents' 
  | 'fragile' 
  | 'perishable' 
  | 'express_packet' 
  | 'oversize';

export type DeliveryPriority = 'standard' | 'express' | 'urgent_sameday';

export type DeliveryStatus = 
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned';

export type FailedReason = 
  | 'recipient_unavailable'
  | 'wrong_address'
  | 'rescheduled_by_customer'
  | 'rejected_cod'
  | 'gate_access_denied'
  | 'damaged_in_transit'
  | 'weather_hazard';

export interface Customer {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'flagged' | 'inactive';
  notes?: string;
  createdAt: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: 'motorbike' | 'cargo_van' | 'electric_bike' | 'scooter';
  vehiclePlate: string;
  batteryOrFuelLevel: number; // percentage 0-100
  status: 'available' | 'delivering' | 'offline' | 'maintenance';
  coordinates: { lat: number; lng: number };
  headingDeg: number;
  rating: number; // 1.0 - 5.0
  completedToday: number;
  totalCompleted: number;
  onTimeRate: number; // 0 - 100 percentage
  speedKmh: number;
  todayEarnings: number;
  avatar: string;
  zone: string;
}

export interface TimelineEvent {
  id: string;
  status: DeliveryStatus;
  timestamp: string;
  title: string;
  description: string;
  actor: string;
  location?: string;
}

export interface NotificationLog {
  id: string;
  channel: 'sms' | 'whatsapp' | 'email';
  timestamp: string;
  recipient: string;
  title: string;
  message: string;
  status: 'delivered' | 'sent' | 'queued';
}

export interface DeliveryOrder {
  id: string;
  trackingNumber: string; // e.g. VP-94812
  deliveryCode: string; // 6 digit secure OTP
  qrPayload: string;
  
  // Sender
  senderId?: string;
  senderName: string;
  senderPhone: string;
  pickupAddress: string;
  pickupCity: string;
  pickupCoordinates: { lat: number; lng: number };
  
  // Recipient
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryCoordinates: { lat: number; lng: number };
  deliveryNotes?: string;
  
  // Parcel specs
  category: ParcelCategory;
  weightKg: number;
  priority: DeliveryPriority;
  declaredValue: number;
  codAmount: number; // Cash on delivery (0 if prepaid)
  paymentStatus: 'prepaid' | 'cod_pending' | 'cod_collected';
  
  // Pricing & Payout
  deliveryFee: number;
  riderCommission: number;
  distanceKm: number;
  
  // Dispatch
  status: DeliveryStatus;
  failedReason?: FailedReason;
  failedNotes?: string;
  rescheduleDate?: string;
  assignedRiderId?: string;
  assignedRiderName?: string;
  
  // Proof of Delivery
  proofOfDelivery?: {
    codeVerified: boolean;
    recipientSignName?: string;
    photoUrl?: string;
    completedAt: string;
    collectedCodAmount?: number;
  };
  
  // Timestamps
  createdAt: string;
  estimatedDeliveryTime: string;
  completedAt?: string;
  
  timeline: TimelineEvent[];
  notifications: NotificationLog[];
}

export interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  type: 'oil_change' | 'brake_service' | 'tire_inspection' | 'battery_health' | 'transmission';
  severity: 'critical' | 'warning' | 'routine';
  status: 'pending' | 'in_progress' | 'resolved';
  odometerKm: number;
  dueDate: string;
  estimatedCost: number;
  description: string;
}

export interface SyncAction {
  id: string;
  action: 'CREATE_ORDER' | 'UPDATE_STATUS' | 'ASSIGN_RIDER' | 'REGISTER_CUSTOMER' | 'VERIFY_DELIVERY' | 'LOG_MAINTENANCE';
  payload: any;
  timestamp: number;
  synced: boolean;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'rider_payout' | 'fuel_charging' | 'vehicle_repair' | 'telecom_sms' | 'insurance' | 'software';
  description: string;
  amount: number;
  referenceId?: string;
}
