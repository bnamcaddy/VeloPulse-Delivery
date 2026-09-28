import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'VeloPulse Logistics Engine',
    timestamp: new Date().toISOString(),
    capabilities: [
      'fleet_telematics',
      'otp_verification',
      'commission_payouts',
      'offline_sync',
      'sms_whatsapp_notifications'
    ]
  });
});

// Production static file serving
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

if (process.env.NODE_ENV === 'production') {
  app.listen(PORT, () => {
    console.log(`VeloPulse server running on port ${PORT}`);
  });
}

export default app;
