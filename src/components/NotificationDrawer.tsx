import React, { useState } from 'react';
import { DeliveryOrder } from '../types';
import { 
  X, 
  MessageSquare, 
  Send, 
  CheckCheck, 
  Smartphone, 
  Copy, 
  Check, 
  Clock, 
  Bell, 
  ExternalLink 
} from 'lucide-react';
import { buildWhatsAppLink, buildSmsLink } from '../utils/logistics';
import { SoundEffects } from '../services/storageService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: DeliveryOrder | null;
  onSendNotification: (orderId: string, channel: 'sms' | 'whatsapp', message: string, title: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  order,
  onSendNotification,
}) => {
  const [templateType, setTemplateType] = useState<'otp' | 'out_for_delivery' | 'delayed' | 'delivered'>('otp');
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  // Pre-configured notification templates
  const getTemplateText = (type: typeof templateType) => {
    switch (type) {
      case 'otp':
        return `Hello ${order.recipientName}, your VeloPulse package ${order.trackingNumber} is scheduled for handoff. Your secure verification OTP code is: ${order.deliveryCode}. Please present this to the courier. Track: https://velopulse.fleet/track/${order.trackingNumber}`;
      case 'out_for_delivery':
        return `🚚 Great news! Courier ${order.assignedRiderName || 'Mateo'} is out for delivery with your parcel ${order.trackingNumber}. Estimated arrival in ~20 minutes. Verification Code: ${order.deliveryCode}.`;
      case 'delayed':
        return `⚠️ VeloPulse Update: Delivery for ${order.trackingNumber} is slightly delayed due to urban traffic. Courier ${order.assignedRiderName || 'on duty'} is making every effort to reach you shortly.`;
      case 'delivered':
        return `✅ Delivered! Your VeloPulse parcel ${order.trackingNumber} has been handed over safely. Thank you for using our express delivery service!`;
    }
  };

  const activeMessage = customText || getTemplateText(templateType);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMessage);
    setCopied(true);
    SoundEffects.playNotificationTone();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const link = buildWhatsAppLink(order.recipientPhone, activeMessage);
    window.open(link, '_blank');
    onSendNotification(order.id, 'whatsapp', activeMessage, 'WhatsApp Customer Alert');
    SoundEffects.playNotificationTone();
    setFeedback('Dispatched via WhatsApp link');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSendSms = () => {
    const link = buildSmsLink(order.recipientPhone, activeMessage);
    window.open(link, '_blank');
    onSendNotification(order.id, 'sms', activeMessage, 'SMS Gateway Alert');
    SoundEffects.playNotificationTone();
    setFeedback('Dispatched via SMS Gateway');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 h-full shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Dispatch Notification Center
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                {order.trackingNumber} · {order.recipientPhone}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Template Picker */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 block">
              Choose Pre-Formatted Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setTemplateType('otp'); setCustomText(''); }}
                className={`p-2 text-xs text-left rounded-lg border transition-colors ${
                  templateType === 'otp'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                🔐 OTP Code Passcode
              </button>
              <button
                onClick={() => { setTemplateType('out_for_delivery'); setCustomText(''); }}
                className={`p-2 text-xs text-left rounded-lg border transition-colors ${
                  templateType === 'out_for_delivery'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                🚚 Out for Delivery
              </button>
              <button
                onClick={() => { setTemplateType('delayed'); setCustomText(''); }}
                className={`p-2 text-xs text-left rounded-lg border transition-colors ${
                  templateType === 'delayed'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                ⚠️ Traffic Delay Notice
              </button>
              <button
                onClick={() => { setTemplateType('delivered'); setCustomText(''); }}
                className={`p-2 text-xs text-left rounded-lg border transition-colors ${
                  templateType === 'delivered'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                ✅ Delivery Complete
              </button>
            </div>
          </div>

          {/* Interactive Message Preview & Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Message Content Preview
              </label>
              <button
                onClick={handleCopy}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={activeMessage}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            />
            <span className="text-[10px] text-neutral-400 mt-1 block">
              Character Count: {activeMessage.length} (approx. {Math.ceil(activeMessage.length / 160)} SMS segment)
            </span>
          </div>

          {/* Action Dispatch Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleSendWhatsApp}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>Send via WhatsApp ({order.recipientPhone})</span>
            </button>

            <button
              onClick={handleSendSms}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Send via Native SMS Gateway</span>
            </button>

            {feedback && (
              <div className="p-2.5 text-center text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg animate-in fade-in">
                {feedback}
              </div>
            )}
          </div>

          {/* Notification Audit History */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 block flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Notification Logs ({order.notifications?.length || 0})
            </label>

            <div className="space-y-2">
              {order.notifications && order.notifications.length > 0 ? (
                order.notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                        {notif.channel}
                      </span>
                      <span>{notif.timestamp}</span>
                    </div>
                    <p className="text-neutral-800 dark:text-neutral-200 line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCheck className="w-3 h-3" /> Status: {notif.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-neutral-400 text-xs">
                  No automated alerts sent yet for this parcel.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
