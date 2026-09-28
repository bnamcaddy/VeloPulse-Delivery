import React, { useState, useEffect, useRef } from 'react';
import { Rider, DeliveryOrder } from '../types';
import { 
  Navigation2, 
  MapPin, 
  Maximize2, 
  Layers, 
  Play, 
  Pause, 
  Battery, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Bike, 
  Truck, 
  PhoneCall, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../utils/logistics';

interface InteractiveFleetMapProps {
  riders: Rider[];
  orders: DeliveryOrder[];
  selectedRiderId: string | null;
  onSelectRider: (riderId: string | null) => void;
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string | null) => void;
  onAssignOrderModal?: (order: DeliveryOrder) => void;
  onUpdateRiderCoordinates?: (riderId: string, coords: { lat: number; lng: number }, heading: number) => void;
}

export const InteractiveFleetMap: React.FC<InteractiveFleetMapProps> = ({
  riders,
  orders,
  selectedRiderId,
  onSelectRider,
  selectedOrderId,
  onSelectOrder,
  onAssignOrderModal,
  onUpdateRiderCoordinates,
}) => {
  const [isSimulating, setIsSimulating] = useState(true);
  const [mapLayer, setMapLayer] = useState<'streets' | 'dark' | 'satellite'>('dark');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'available' | 'high_priority'>('all');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Map bounding coordinates for San Francisco Metro
  const MAP_BOUNDS = {
    minLat: 37.7550,
    maxLat: 37.8050,
    minLng: -122.4650,
    maxLng: -122.3850,
  };

  // Convert lat/lng to percentage coordinates (0-100%) inside the map container
  const latLngToPercent = (lat: number, lng: number) => {
    const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
    const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
    return { 
      x: Math.max(3, Math.min(97, x)), 
      y: Math.max(3, Math.min(97, y)) 
    };
  };

  // Simulation tick: Couriers gently drift toward target destinations or patrol zones
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      riders.forEach(rider => {
        if (rider.status === 'delivering' || rider.status === 'available') {
          // Find rider's active order if delivering
          const activeOrder = orders.find(o => o.assignedRiderId === rider.id && (o.status === 'out_for_delivery' || o.status === 'in_transit'));
          let targetLat = rider.coordinates.lat;
          let targetLng = rider.coordinates.lng;

          if (activeOrder) {
            targetLat = activeOrder.deliveryCoordinates.lat;
            targetLng = activeOrder.deliveryCoordinates.lng;
          } else {
            // gentle patrol
            targetLat += (Math.random() - 0.5) * 0.001;
            targetLng += (Math.random() - 0.5) * 0.001;
          }

          const dLat = targetLat - rider.coordinates.lat;
          const dLng = targetLng - rider.coordinates.lng;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);

          if (dist > 0.0002) {
            const step = 0.00035; // smooth realistic urban speed
            const newLat = rider.coordinates.lat + (dLat / dist) * step;
            const newLng = rider.coordinates.lng + (dLng / dist) * step;
            const heading = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

            if (onUpdateRiderCoordinates) {
              onUpdateRiderCoordinates(rider.id, { lat: newLat, lng: newLng }, heading);
            }
          }
        }
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isSimulating, riders, orders, onUpdateRiderCoordinates]);

  // Selected entities
  const activeRider = riders.find(r => r.id === selectedRiderId);
  const activeOrder = orders.find(o => o.id === selectedOrderId);

  // Filter orders based on active filter
  const visibleOrders = orders.filter(o => {
    if (filterType === 'high_priority') return o.priority === 'urgent_sameday' || o.priority === 'express';
    if (filterType === 'active') return o.status === 'out_for_delivery' || o.status === 'in_transit' || o.status === 'picked_up';
    return true;
  });

  const visibleRiders = riders.filter(r => {
    if (filterType === 'available') return r.status === 'available';
    if (filterType === 'active') return r.status === 'delivering';
    return true;
  });

  // Handle map drag/pan
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    onSelectRider(null);
    onSelectOrder(null);
  };

  return (
    <div className="relative w-full h-[580px] bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-sm select-none">
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg pointer-events-auto shadow-md">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Fleet & Drops ({orders.length})
          </button>
          <button
            onClick={() => setFilterType('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === 'active'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            In-Transit Active
          </button>
          <button
            onClick={() => setFilterType('available')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === 'available'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Available Riders
          </button>
          <button
            onClick={() => setFilterType('high_priority')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === 'high_priority'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Urgent SLA
          </button>
        </div>

        {/* Right: Simulation & Zoom Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border backdrop-blur-md transition-colors shadow-md ${
              isSimulating 
                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300' 
                : 'bg-neutral-900/90 border-neutral-800 text-neutral-400'
            }`}
            title="Toggle live telemetry movement"
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Live Telemetry' : 'Paused'}</span>
            {isSimulating && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          <div className="flex items-center bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg p-0.5 shadow-md">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
              className="px-2.5 py-1 text-xs font-mono text-neutral-300 hover:text-white hover:bg-neutral-800 rounded"
              title="Zoom In"
            >
              +
            </button>
            <span className="text-[11px] font-mono text-neutral-400 px-1.5 tabular-nums">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
              className="px-2.5 py-1 text-xs font-mono text-neutral-300 hover:text-white hover:bg-neutral-800 rounded"
              title="Zoom Out"
            >
              -
            </button>
            <button
              onClick={resetView}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded ml-1"
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg p-0.5">
            <button
              onClick={() => setMapLayer(mapLayer === 'dark' ? 'streets' : mapLayer === 'streets' ? 'satellite' : 'dark')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded capitalize"
              title="Change Map Style"
            >
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              <span>{mapLayer}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div 
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div 
          className="absolute inset-0 transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          }}
        >
          {/* Vector City Map Background Styling */}
          <div className={`absolute inset-0 transition-colors duration-300 ${
            mapLayer === 'dark' 
              ? 'bg-[#0b101b]' 
              : mapLayer === 'streets' 
              ? 'bg-[#1e293b]' 
              : 'bg-[#080d14]'
          }`}>
            {/* SVG Urban Grid, Coastline, and Transit Arteries */}
            <svg className="w-full h-full opacity-70" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                </pattern>
                <linearGradient id="bay-water" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.15" />
                </linearGradient>
              </defs>

              <rect width="100%" height="100%" fill="url(#city-grid)" />

              {/* San Francisco Bay Water Polygon */}
              <path 
                d="M 680,0 Q 720,180 820,320 T 960,580 L 1000,580 L 1000,0 Z" 
                fill="url(#bay-water)" 
                stroke="rgba(56, 189, 248, 0.15)" 
                strokeWidth="1.5"
              />

              {/* Major Highway Arteries (Market St, Mission St, Bay Bridge Corridor) */}
              <path d="M 120,480 L 450,280 L 780,120" stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
              <path d="M 240,540 L 490,360 L 820,240" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none" />
              <path d="M 450,280 L 890,210" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="4" strokeDasharray="4 2" fill="none" />
              <path d="M 300,80 L 450,280 L 520,520" stroke="rgba(255,255,255,0.09)" strokeWidth="2.5" fill="none" />
              <path d="M 180,200 L 720,200" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none" />
              <path d="M 160,350 L 680,350" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none" />

              {/* Connecting Route lines for active deliveries */}
              {visibleOrders.map(order => {
                if (order.status === 'delivered') return null;
                const dropPos = latLngToPercent(order.deliveryCoordinates.lat, order.deliveryCoordinates.lng);
                const assignedRider = riders.find(r => r.id === order.assignedRiderId);
                
                let startPos = latLngToPercent(order.pickupCoordinates.lat, order.pickupCoordinates.lng);
                if (assignedRider && (order.status === 'out_for_delivery' || order.status === 'in_transit')) {
                  startPos = latLngToPercent(assignedRider.coordinates.lat, assignedRider.coordinates.lng);
                }

                const isSelected = selectedOrderId === order.id;

                return (
                  <g key={`route-${order.id}`}>
                    <path
                      d={`M ${startPos.x}% ${startPos.y}% Q ${(startPos.x + dropPos.x)/2 + 2}% ${(startPos.y + dropPos.y)/2 - 3}% ${dropPos.x}% ${dropPos.y}%`}
                      fill="none"
                      stroke={
                        order.status === 'failed' 
                          ? '#ef4444' 
                          : order.priority === 'urgent_sameday' 
                          ? '#f59e0b' 
                          : isSelected 
                          ? '#3b82f6' 
                          : 'rgba(99, 102, 241, 0.45)'
                      }
                      strokeWidth={isSelected ? 3 : 1.5}
                      strokeDasharray={order.status === 'out_for_delivery' ? '4 3' : '2 2'}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Depot Fleet Headquarters Marker */}
            <div 
              className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 group pointer-events-auto"
              style={{ left: '46%', top: '52%' }}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-indigo-500 flex items-center justify-center shadow-lg">
                  <span className="text-[10px] font-bold text-indigo-400">HUB</span>
                </div>
                <div className="absolute -top-7 px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-700 text-[10px] font-medium text-neutral-300 whitespace-nowrap shadow opacity-0 group-hover:opacity-100 transition-opacity">
                  VeloPulse Central Depot
                </div>
              </div>
            </div>

            {/* Delivery Order Dropoff Pins */}
            {visibleOrders.map(order => {
              const pos = latLngToPercent(order.deliveryCoordinates.lat, order.deliveryCoordinates.lng);
              const isSelected = selectedOrderId === order.id;

              let pinColor = 'bg-indigo-500 border-indigo-300 text-white';
              if (order.status === 'delivered') pinColor = 'bg-emerald-500 border-emerald-300 text-white';
              else if (order.status === 'failed') pinColor = 'bg-rose-500 border-rose-300 text-white animate-bounce';
              else if (order.priority === 'urgent_sameday') pinColor = 'bg-amber-500 border-amber-300 text-neutral-950 font-bold';

              return (
                <div
                  key={`drop-${order.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectOrder(order.id);
                  }}
                  className={`absolute z-15 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 pointer-events-auto ${
                    isSelected ? 'scale-125 z-25' : 'hover:scale-115'
                  }`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className="relative group flex items-center justify-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-md ${pinColor}`}>
                      {order.status === 'delivered' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : order.status === 'failed' ? (
                        <AlertCircle className="w-3.5 h-3.5" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Hover Card */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-neutral-900/95 border border-neutral-700 text-neutral-100 text-xs whitespace-nowrap pointer-events-none shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold">{order.trackingNumber}</span>
                        <span className="text-[10px] text-neutral-400 capitalize">· {order.status.replace('_', ' ')}</span>
                      </div>
                      <div className="text-[11px] text-neutral-300 truncate max-w-[160px]">
                        {order.recipientName}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Courier Riders Pins with Directional Headings */}
            {visibleRiders.map(rider => {
              const pos = latLngToPercent(rider.coordinates.lat, rider.coordinates.lng);
              const isSelected = selectedRiderId === rider.id;

              return (
                <div
                  key={`rider-${rider.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRider(rider.id);
                  }}
                  className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 pointer-events-auto ${
                    isSelected ? 'scale-130 z-30' : 'hover:scale-115'
                  }`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className="relative group flex items-center justify-center">
                    {/* Pulsing ring for active delivering riders */}
                    {rider.status === 'delivering' && (
                      <span className="absolute w-10 h-10 rounded-full bg-blue-500/20 animate-ping" />
                    )}

                    {/* Rider Avatar & Vehicle Icon Container */}
                    <div className={`relative w-8 h-8 rounded-full border-2 overflow-hidden shadow-lg transition-transform ${
                      isSelected 
                        ? 'border-blue-400 ring-2 ring-blue-500/50' 
                        : rider.status === 'available' 
                        ? 'border-emerald-400' 
                        : rider.status === 'maintenance'
                        ? 'border-amber-500'
                        : 'border-blue-500'
                    }`}>
                      <img 
                        src={rider.avatar} 
                        alt={rider.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    </div>

                    {/* Directional Heading indicator arrow */}
                    <div 
                      className="absolute -top-1 w-3 h-3 text-blue-400 pointer-events-none transition-transform duration-300"
                      style={{ transform: `rotate(${rider.headingDeg}deg) translateY(-8px)` }}
                    >
                      <Navigation2 className="w-3 h-3 fill-blue-400" />
                    </div>

                    {/* Mini Status Tag */}
                    <div className="absolute -bottom-5 px-1.5 py-0.5 rounded bg-neutral-900/90 border border-neutral-700 text-[9px] font-mono text-neutral-200 whitespace-nowrap shadow">
                      {rider.name.split(' ')[0]} · {rider.speedKmh} km/h
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Floating Telemetry Inspector Drawer */}
      {(activeRider || activeOrder) && (
        <div className="absolute bottom-3 left-3 right-3 z-30 p-3 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
          {activeRider && (
            <div className="flex items-center gap-3">
              <img 
                src={activeRider.avatar} 
                alt={activeRider.name} 
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-lg object-cover border border-neutral-700" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">{activeRider.name}</h4>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                    activeRider.status === 'available' 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}>
                    {activeRider.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-neutral-400">· {activeRider.vehiclePlate}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5 text-neutral-300" /> {activeRider.batteryOrFuelLevel}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-neutral-300" /> {activeRider.speedKmh} km/h
                  </span>
                  <span className="font-mono text-neutral-300">
                    Earned Today: {formatCurrency(activeRider.todayEarnings)}
                  </span>
                  <span>{activeRider.completedToday} Drops Completed</span>
                </div>
              </div>
            </div>
          )}

          {activeOrder && !activeRider && (
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-indigo-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-white">{activeOrder.trackingNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 capitalize">
                    {activeOrder.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-amber-400 font-medium capitalize">
                    · {activeOrder.priority.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  To: <span className="text-neutral-200 font-medium">{activeOrder.recipientName}</span> ({activeOrder.deliveryAddress})
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {activeOrder && activeOrder.status === 'pending' && onAssignOrderModal && (
              <button
                onClick={() => onAssignOrderModal(activeOrder)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5"
              >
                Assign Courier <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                onSelectRider(null);
                onSelectOrder(null);
              }}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
