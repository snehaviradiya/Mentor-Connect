import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();

// Cross-Origin Resource Sharing (CORS) setup
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in local development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

import rateLimit from 'express-rate-limit';

// Apply rate limiting to all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { status: 'fail', code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' },
});

app.use('/api/', apiLimiter);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Mentor Connect API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount modular API route handlers
app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/bookings', bookingRoutes);

// Catch-all 404 route for undefined endpoints
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    code: 'ROUTE_NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl} on this server.`,
  });
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
