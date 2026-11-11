import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { apiLimiter } from './middleware/rateLimit.js';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(createCorsMiddleware());


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Mentor Connect API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/', apiLimiter);

// Mount modular API route handlers
app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/notifications', notificationRoutes);

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
