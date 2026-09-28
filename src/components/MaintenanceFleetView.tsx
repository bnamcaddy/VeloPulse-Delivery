import React, { useState } from 'react';
import { MaintenanceAlert, Rider } from '../types';
import { 
  Wrench, 
  AlertTriangle, 
  BatteryWarning, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Car, 
  Calendar, 
  DollarSign, 
  X,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency } from '../utils/logistics';
import { SoundEffects } from '../services/storageService';

interface MaintenanceFleetViewProps {
  alerts: MaintenanceAlert[];
  riders: Rider[];
  onAddMaintenance: (alert: MaintenanceAlert) => void;
  onResolveMaintenance: (alertId: string) => void;
}

export const MaintenanceFleetView: React.FC<MaintenanceFleetViewProps> = ({
  alerts,
  riders,
  onAddMaintenance,
  onResolveMaintenance,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehiclePlate, setVehiclePlate] = useState('EB-SF-809');
  const [vehicleName, setVehicleName] = useState('VoltCargo E-Bike 09');
  const [type, setType] = useState<MaintenanceAlert['type']>('battery_health');
  const [severity, setSeverity] = useState<MaintenanceAlert['severity']>('warning');
  const [odometerKm, setOdometerKm] = useState(5200);
  const [estimatedCost, setEstimatedCost] = useState(150);
  const [dueDate, setDueDate] = useState('2026-10-15');
  const [description, setDescription] = useState('');

  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
  const warningCount = alerts.filter(a => a.severity === 'warning' && a.status !== 'resolved').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newAlert: MaintenanceAlert = {
      id: 'maint-' + Date.now(),
      vehicleId: vehiclePlate,
      vehicleName,
      vehiclePlate,
      type,
      severity,
      status: 'pending',
      odometerKm,
      dueDate,
      estimatedCost,
      description,
    };

    onAddMaintenance(newAlert);
    SoundEffects.playAlertTone();
    setIsModalOpen(false);
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-500" />
            <span>Fleet Maintenance & Vehicle Health Monitor</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Preventative maintenance scheduling, EV battery telemetry, and service safety logs
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Service Inspection</span>
        </button>
      </div>

      {/* Critical System Alert Banner */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-semibold text-rose-900 dark:text-rose-200">
              {criticalCount} Critical Fleet Vehicle Alert(s) Requiring Immediate Depot Attention
            </h4>
            <p className="text-rose-700 dark:text-rose-300 mt-0.5">
              EB-SF-809 has cell capacity degradation below safety threshold. Vehicle has been set to Maintenance Mode to protect courier safety.
            </p>
          </div>
        </div>
      )}

      {/* Maintenance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert) => {
          const isResolved = alert.status === 'resolved';

          return (
            <div
              key={alert.id}
              className={`p-5 rounded-xl border transition-all ${
                isResolved
                  ? 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 opacity-70'
                  : alert.severity === 'critical'
                  ? 'border-rose-300 dark:border-rose-900 bg-white dark:bg-neutral-900 shadow-sm'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                      {alert.vehicleName}
                    </span>
                    <span className="font-mono text-xs text-neutral-400">
                      ({alert.vehiclePlate})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 capitalize">
                    <span>{alert.type.replace('_', ' ')}</span>
                    <span>·</span>
                    <span className="font-mono">{alert.odometerKm.toLocaleString()} km</span>
                    <span>·</span>
                    <span>Due: {alert.dueDate}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                  isResolved
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : alert.severity === 'critical'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {isResolved ? 'Resolved' : alert.severity}
                </span>
              </div>

              <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-3 bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-lg">
                {alert.description}
              </p>

              <div className="flex items-center justify-between pt-3 text-xs">
                <span className="font-mono text-neutral-500">
                  Est. Service: <strong className="text-neutral-900 dark:text-white">{formatCurrency(alert.estimatedCost)}</strong>
                </span>

                {!isResolved ? (
                  <button
                    onClick={() => {
                      onResolveMaintenance(alert.id);
                      SoundEffects.playSuccessChime();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Service Completed</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Cleared for Highway
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-500" />
                <span>Log Vehicle Maintenance</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-600 dark:text-neutral-400 mb-1 block">Vehicle Plate</label>
                  <input
                    type="text"
                    required
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-neutral-600 dark:text-neutral-400 mb-1 block">Vehicle Model</label>
                  <input
                    type="text"
                    required
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-600 dark:text-neutral-400 mb-1 block">Maintenance Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none capitalize"
                  >
                    <option value="brake_service">Brake Service</option>
                    <option value="battery_health">Battery Health</option>
                    <option value="oil_change">Oil & Fluids</option>
                    <option value="tire_inspection">Tire Inspection</option>
                    <option value="transmission">Transmission Check</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-600 dark:text-neutral-400 mb-1 block">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none capitalize"
                  >
                    <option value="routine">Routine</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical / Ground Vehicle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-600 dark:text-neutral-400 mb-1 block">Odometer (km)</label>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-neutral-600 dark:text-neutral-400 mb-1 block">Estimated Cost ($)</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-600 dark:text-neutral-400 mb-1 block">Mechanic Notes / Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specify part numbers or inspection findings..."
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-neutral-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                >
                  Schedule Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
