import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import registrationsRoutes from './routes/registrations.routes.js';
import inquiriesRoutes from './routes/inquiries.routes.js';
import sponsorsRoutes from './routes/sponsors.routes.js';
import tournamentsRoutes, { gamesList, newsList } from './routes/tournaments.routes.js';
import { sendOtp } from './controllers/auth.controller.js';
import { connectToDatabase } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/inquiries', inquiriesRoutes);
app.use('/api/sponsors', sponsorsRoutes);
app.use('/api/tournaments', tournamentsRoutes);
app.get('/api/games', (req, res) => res.json(gamesList));
app.get('/api/news', (req, res) => res.json(newsList));

// Top-level aliases for direct frontend client calls
app.post('/api/send-otp', sendOtp);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const { client } = await connectToDatabase();
    if (client) dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'degraded (' + e.message + ')';
  }

  res.status(200).json({
    status: 'online',
    service: 'Live tournaments.in API',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's'
  });
});

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Live tournaments.in Backend API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/send-otp',
      '/api/auth/verify-otp',
      '/api/registrations',
      '/api/inquiries',
      '/api/sponsors'
    ]
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(' [Backend Error]', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// Only listen when executed directly
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(` 🏆 Live tournaments.in Backend Server Active`);
    console.log(` 🚀 Listening at: http://localhost:${PORT}`);
    console.log(` 🩺 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
}

export default app;
