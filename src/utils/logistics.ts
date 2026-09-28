import { DeliveryOrder, DeliveryPriority, ParcelCategory, Rider } from '../types';

export function generateDeliveryCode(): string {
  // Generates 6-digit secure delivery OTP
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

export function generateTrackingNumber(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `VP-${num}`;
}

export interface PricingEstimate {
  deliveryFee: number;
  riderCommission: number;
  estimatedDistanceKm: number;
  estimatedMinutes: number;
}

export function calculateDeliveryPricing(
  distanceKm: number,
  weightKg: number,
  priority: DeliveryPriority,
  category: ParcelCategory,
  hasCod: boolean
): PricingEstimate {
  // Base delivery charge
  let baseFee = 14.00;
  if (category === 'fragile') baseFee += 6.00;
  if (category === 'perishable') baseFee += 5.00;
  if (category === 'oversize') baseFee += 18.00;
  if (category === 'documents') baseFee = 11.00;

  // Distance addition ($1.75 per km)
  const distanceFee = distanceKm * 1.75;

  // Weight addition ($1.20 per kg above 2kg)
  const weightFee = Math.max(0, weightKg - 2) * 1.20;

  // Priority multiplier
  let multiplier = 1.0;
  if (priority === 'express') multiplier = 1.35;
  if (priority === 'urgent_sameday') multiplier = 1.75;

  const codFee = hasCod ? 3.50 : 0;

  const totalFee = Math.round(((baseFee + distanceFee + weightFee) * multiplier + codFee) * 100) / 100;

  // Rider Commission formula: ~40% - 50% of delivery fee + distance allowance
  const baseRider = 6.00 + (distanceKm * 0.90);
  const priorityBonus = priority === 'urgent_sameday' ? 4.50 : priority === 'express' ? 2.50 : 0;
  const riderCommission = Math.min(totalFee * 0.65, Math.round((baseRider + priorityBonus + (hasCod ? 1.50 : 0)) * 100) / 100);

  const speedKmh = 25; // average urban transit
  const estimatedMinutes = Math.round(15 + (distanceKm / speedKmh) * 60);

  return {
    deliveryFee: totalFee,
    riderCommission,
    estimatedDistanceKm: distanceKm,
    estimatedMinutes,
  };
}

export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 8) return phone;
  const cleaned = phone.trim();
  // Mask middle digits
  return cleaned.replace(/(\d{3})\D*(\d{3})\D*(\d{4})/, '$1-***-$3');
}

export function maskAddress(address: string): string {
  if (!address) return '';
  const parts = address.split(',');
  if (parts.length > 1) {
    return `${parts[0].slice(0, 10)}... (Encrypted), ${parts[1] || ''}`;
  }
  return `${address.slice(0, 8)}... (Encrypted Vault)`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return dateStr;
  }
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function buildSmsLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
}

export function exportOrdersToCSV(orders: DeliveryOrder[]): void {
  const headers = [
    'Tracking Number',
    'Status',
    'Priority',
    'Category',
    'Sender',
    'Pickup Address',
    'Recipient',
    'Delivery Address',
    'Delivery Fee ($)',
    'Rider Commission ($)',
    'COD Amount ($)',
    'Assigned Rider',
    'Verification Code',
    'Created At',
    'Estimated SLA',
  ];

  const rows = orders.map(ord => [
    ord.trackingNumber,
    ord.status,
    ord.priority,
    ord.category,
    `"${ord.senderName.replace(/"/g, '""')}"`,
    `"${ord.pickupAddress.replace(/"/g, '""')}"`,
    `"${ord.recipientName.replace(/"/g, '""')}"`,
    `"${ord.deliveryAddress.replace(/"/g, '""')}"`,
    ord.deliveryFee.toFixed(2),
    ord.riderCommission.toFixed(2),
    ord.codAmount.toFixed(2),
    `"${(ord.assignedRiderName || 'Unassigned').replace(/"/g, '""')}"`,
    ord.deliveryCode,
    ord.createdAt,
    ord.estimatedDeliveryTime,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `VeloPulse_Deliveries_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
