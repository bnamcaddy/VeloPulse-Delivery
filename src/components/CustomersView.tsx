import React, { useState } from 'react';
import { Customer, DeliveryOrder } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  DollarSign, 
  Lock, 
  Unlock, 
  CheckCircle, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency, maskPhoneNumber, maskAddress } from '../utils/logistics';
import { SoundEffects } from '../services/storageService';

interface CustomersViewProps {
  customers: Customer[];
  orders: DeliveryOrder[];
  onAddCustomer: (customer: Customer) => void;
  onSelectCustomerOrders?: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  onAddCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEncryptedView, setIsEncryptedView] = useState(true);

  // New Customer Form State
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('San Francisco, CA');
  const [postalCode, setPostalCode] = useState('94103');
  const [notes, setNotes] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) return;

    const newCustomer: Customer = {
      id: 'cust-' + Date.now(),
      name,
      company: company || undefined,
      phone,
      email,
      address,
      city,
      postalCode,
      totalOrders: 0,
      totalSpent: 0,
      status: 'active',
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddCustomer(newCustomer);
    SoundEffects.playSuccessChime();
    setIsRegisterOpen(false);
    // Reset form
    setName('');
    setCompany('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Customer Directory & Accounts
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage sender registries, recipient address books, and encrypted billing profiles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEncryptedView(!isEncryptedView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isEncryptedView
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
            }`}
            title="Toggle AES-256 PII compliance masking"
          >
            {isEncryptedView ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isEncryptedView ? 'PII Encrypted' : 'Plaintext Mode'}</span>
          </button>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm hover:shadow-indigo-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Customer</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, company, phone, or email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
          {filteredCustomers.length} registered profiles
        </div>
      </div>

      {/* Customers Table / Grid */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 font-medium">
                <th className="py-3 px-4">Customer / Company</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Default Pickup Address</th>
                <th className="py-3 px-4 text-center">Deliveries</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredCustomers.map((cust) => {
                const customerOrders = orders.filter(o => o.senderId === cust.id);
                return (
                  <tr 
                    key={cust.id}
                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                        <span>{cust.name}</span>
                        {cust.company && (
                          <span className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-neutral-400" />
                            {cust.company}
                          </span>
                        )}
                      </div>
                      {cust.notes && (
                        <p className="text-[11px] text-neutral-400 truncate max-w-xs mt-0.5">
                          {cust.notes}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{isEncryptedView ? maskPhoneNumber(cust.phone) : cust.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
                        <Mail className="w-3 h-3 text-neutral-400" />
                        <span>{cust.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                        <div>
                          <span>{isEncryptedView ? maskAddress(cust.address) : cust.address}</span>
                          <span className="block text-[11px] text-neutral-400 font-mono">
                            {cust.city} {cust.postalCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {cust.totalOrders + customerOrders.length} drops
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-neutral-900 dark:text-white">
                      {formatCurrency(cust.totalSpent)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Customer Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                    Register Customer Profile
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Add corporate or retail shipper to delivery network
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                    Contact Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Samantha Drake"
                    className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                    Company / Entity (Optional)
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Drake Gourmet Co."
                    className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                    Phone Number (SMS alerts) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="billing@customer.com"
                    className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                  Default Pickup / HQ Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, Suite or Floor #"
                  className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                    City, State
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-600 dark:text-neutral-400 mb-1 block">
                  Special Dispatch Notes (Cold storage, security clearance, etc.)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes for couriers on arrival..."
                  className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                >
                  Save Customer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
