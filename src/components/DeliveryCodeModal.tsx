import React, { useState } from 'react';
import { DeliveryOrder } from '../types';
import { 
  X, 
  ShieldCheck, 
  Copy, 
  Check, 
  QrCode, 
  MessageSquare, 
  Share2, 
  Send,
  Lock
} from 'lucide-react';
import { buildWhatsAppLink, buildSmsLink } from '../utils/logistics';
import { SoundEffects } from '../services/storageService';

interface DeliveryCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: DeliveryOrder | null;
  onLogNotification?: (orderId: string, channel: 'sms' | 'whatsapp', text: string) => void;
}

export const DeliveryCodeModal: React.FC<DeliveryCodeModalProps> = ({
  isOpen,
  onClose,
  order,
  onLogNotification,
}) => {
  const [copied, setCopied] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(order.deliveryCode);
    setCopied(true);
    SoundEffects.playNotificationTone();
    setTimeout(() => setCopied(false), 2000);
  };

  const notificationText = `Hello ${order.recipientName}, your VeloPulse package ${order.trackingNumber} is out for delivery. Your secure 6-digit handoff verification code is: ${order.deliveryCode}. Please present this code to courier ${order.assignedRiderName || 'on arrival'}.`;

  const handleSendWhatsApp = () => {
    const link = buildWhatsAppLink(order.recipientPhone, notificationText);
    window.open(link, '_blank');
    if (onLogNotification) {
      onLogNotification(order.id, 'whatsapp', notificationText);
    }
    setSentNotice('WhatsApp link generated & dispatched!');
    setTimeout(() => setSentNotice(null), 3000);
  };

  const handleSendSms = () => {
    const link = buildSmsLink(order.recipientPhone, notificationText);
    window.open(link, '_blank');
    if (onLogNotification) {
      onLogNotification(order.id, 'sms', notificationText);
    }
    setSentNotice('SMS alert queued & sent!');
    setTimeout(() => setSentNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Delivery Verification Code
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Anti-fraud proof of delivery protocol
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-6">
          <div>
            <span className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider">
              Handoff OTP Passcode
            </span>
            {/* 6-Digit Display */}
            <div className="mt-2 flex items-center justify-center gap-2">
              {order.deliveryCode.split('').map((digit, idx) => (
                <div
                  key={idx}
                  className="w-11 h-13 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-indigo-500/30 dark:border-indigo-500/50 flex items-center justify-center text-2xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400 shadow-inner"
                >
                  {digit}
                </div>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Code Copied to Clipboard!' : 'Copy 6-Digit Code'}</span>
            </button>
          </div>

          {/* QR Code Graphic Box */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-col items-center">
            {/* Simulated Clean SVG QR Code */}
            <div className="w-36 h-36 bg-white p-2.5 rounded-lg shadow-sm border border-neutral-200 flex flex-col justify-between">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-neutral-900">
                {/* QR Finder patterns */}
                <rect x="5" y="5" width="28" height="28" fill="#18181b" />
                <rect x="9" y="9" width="20" height="20" fill="white" />
                <rect x="13" y="13" width="12" height="12" fill="#18181b" />

                <rect x="67" y="5" width="28" height="28" fill="#18181b" />
                <rect x="71" y="9" width="20" height="20" fill="white" />
                <rect x="75" y="13" width="12" height="12" fill="#18181b" />

                <rect x="5" y="67" width="28" height="28" fill="#18181b" />
                <rect x="9" y="71" width="20" height="20" fill="white" />
                <rect x="13" y="75" width="12" height="12" fill="#18181b" />

                {/* Simulated Data blocks */}
                <rect x="38" y="8" width="6" height="6" />
                <rect x="48" y="12" width="6" height="6" />
                <rect x="38" y="24" width="8" height="6" />
                <rect x="52" y="24" width="6" height="6" />
                
                <rect x="10" y="40" width="8" height="6" />
                <rect x="24" y="42" width="6" height="8" />
                <rect x="40" y="40" width="20" height="20" />
                <rect x="46" y="46" width="8" height="8" fill="white" />

                <rect x="68" y="40" width="8" height="6" />
                <rect x="80" y="44" width="14" height="6" />

                <rect x="40" y="68" width="6" height="14" />
                <rect x="52" y="74" width="12" height="6" />
                <rect x="72" y="68" width="8" height="8" />
                <rect x="84" y="74" width="10" height="18" />
              </svg>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 mt-2">
              SCAN TO VERIFY · {order.trackingNumber}
            </span>
          </div>

          {/* Quick Share to Recipient */}
          <div className="space-y-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 block">
              Send code directly to <span className="font-semibold text-neutral-900 dark:text-white">{order.recipientName}</span> ({order.recipientPhone})
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleSendWhatsApp}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
              </button>
              <button
                onClick={handleSendSms}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send SMS Alert</span>
              </button>
            </div>

            {sentNotice && (
              <div className="p-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg animate-in fade-in">
                {sentNotice}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
