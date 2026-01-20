/**
 * Express Server Entry Point
 * 
 * This server acts as a proxy for TheMealDB API, hiding the API key
 * from the client and providing caching, security, and compression.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { mealdbRouter } from './routes/mealdb.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;

// ----- Security Middleware -----
// Helmet sets various HTTP headers for security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disable for development; configure properly in production
}));

// ----- CORS Configuration -----
// Allow requests from the Vite dev server and production origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173', // Vite preview
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ----- Compression -----
// Compress all responses for better performance
app.use(compression());

// ----- JSON Body Parser -----
app.use(express.json());

// ----- Health Check Endpoint -----
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ----- API Routes -----
// Mount the MealDB proxy routes under /api
app.use('/api', mealdbRouter);

// ----- 404 Handler -----
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// ----- Global Error Handler -----
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  });
});

// ----- Start Server -----
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API proxy ready at http://localhost:${PORT}/api`);
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
});
