import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { pool } from './src/config/db.js';
import errorHandler from './src/middleware/errorHandler.js';

import authRoutes from './src/routes/auth.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import customersRoutes from './src/routes/customers.routes.js';
import ridersRoutes from './src/routes/riders.routes.js';
import deliveriesRoutes from './src/routes/deliveries.routes.js';
import storesRoutes from './src/routes/stores.routes.js';
import reportsRoutes from './src/routes/reports.routes.js';
import pricingRoutes from './src/routes/pricing.routes.js';
import settingsRoutes from './src/routes/settings.routes.js';
import trackingRoutes from './src/routes/tracking.routes.js';
import customerRoutes from './src/routes/customer.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'G4 Delivery API is running' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/riders', ridersRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/tracking', trackingRoutes);

// Customer-facing API (merged from Flutter app backend)
app.use('/api/v1', customerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Connect to DB then start server
async function startServer() {
  try {
    const client = await pool.connect();
    client.release();
    console.log('✅ PostgreSQL connected');

    app.listen(PORT, () => {
      console.log(`🚀 G4 Delivery Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }
}

startServer();
