import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// Routes
import ideasRouter from './routes/ideas.js';
import votesRouter from './routes/votes.js';
import authRouter from './routes/auth.js';
import webhooksRouter from './routes/webhooks.js';
import emailsRouter from './routes/emails.js';
import feedbackRouter from './routes/feedback.js';

// Config & Services
import { config } from './config/env.js';

// Jobs
import { checkScheduleHealth } from './jobs/backlog_check.js';

const app = express();
const PORT = config.port;

// Trust proxy (required for Fly.io/Vercel to see real IPs)
app.set('trust proxy', 1);

// Security & Performance Middleware
app.use(helmet());
app.use(compression());

// Structured Logging Middleware
// Logs request/response with timing, status, and method/path
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Skip logging for health checks to reduce noise
  if (req.path === '/health') {
    return next();
  }

  // Capture the original send function
  const originalSend = res.send;

  // Override send to log response
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log structured request/response
    const logLevel = statusCode >= 400 ? 'error' : 'info';
    const timestamp = new Date().toISOString();

    console.log(JSON.stringify({
      timestamp,
      level: logLevel,
      requestId,
      method: req.method,
      path: req.path,
      query: req.query && Object.keys(req.query).length > 0 ? req.query : undefined,
      status: statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    }));

    // Call original send function
    return originalSend.call(this, data);
  };

  next();
});

// Rate Limiting (Relaxed in non-production)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://zerosbykai.vercel.app',
  'https://zerosbykai.com',
  'https://www.zerosbykai.com',
  config.frontendUrl
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || config.nodeEnv !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'zerosbykai-api' });
});

// Routes
app.use('/api/ideas', ideasRouter);
app.use('/api/votes', votesRouter);
app.use('/api/auth', authRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/feedback', feedbackRouter);

// Newsletter subscribe shortcut (maps to /api/auth/subscribe)
app.post('/api/subscribe', (req, res, next) => {
  req.url = '/subscribe';
  authRouter(req, res, next);
});

// Cron Jobs
// Monday weekly digest: Triggered via GitHub Actions (.github/workflows/weekly-digest.yml)
// Sunday scraping is run manually to populate backlog

// Wed, Fri, and Sunday 9 AM UTC: Check Schedule Health
cron.schedule('0 9 * * 0,3,5', async () => {
  console.log('Running scheduled backlog health check...');
  try {
    await checkScheduleHealth();
  } catch (error) {
    console.error('Error in scheduled backlog health check:', error);
  }
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;

  if (config.nodeEnv !== 'test') {
    console.error(`[Error] ${req.method} ${req.url}:`, err.message);
    if (statusCode === 500) console.error(err.stack);
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    message: config.nodeEnv === 'development' ? err.message : undefined,
    code: err.code
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ZerosByKai API running on port ${PORT}`);
  console.log(`📧 Cron jobs scheduled (backlog health check)`);
});
