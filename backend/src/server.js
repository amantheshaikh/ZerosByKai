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

// Config & Services
import { config } from './config/env.js';

// Jobs
import { pickAndPublishIdeas, calculateWinner, sendWeeklyDigest } from './jobs/weekly.js';
import { checkBacklogHealth } from './jobs/backlog_check.js';

const app = express();
const PORT = config.port;

// Trust proxy (required for Fly.io/Vercel to see real IPs)
app.set('trust proxy', 1);

// Security & Performance Middleware
app.use(helmet());
app.use(compression());

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

// Newsletter subscribe shortcut (maps to /api/auth/subscribe)
app.post('/api/subscribe', (req, res, next) => {
  req.url = '/subscribe';
  authRouter(req, res, next);
});

// Cron Jobs
// Sunday scraping moved to GitHub Actions (.github/workflows/reddit-scraper.yml)

// Monday 9 AM UTC: Pick ideas from backlog, calculate winner, send weekly digest (sequential)
cron.schedule('0 9 * * 1', async () => {
  console.log('Picking ideas from backlog for this week...');
  try {
    await pickAndPublishIdeas();
    console.log('Publishing completed');
  } catch (error) {
    console.error('Error in picking/publishing ideas:', error);
  }

  console.log('Running weekly winner calculation...');
  try {
    await calculateWinner();
    console.log('Winner calculated successfully');
  } catch (error) {
    console.error('Error calculating winner:', error);
  }

  console.log('Sending weekly digest...');
  try {
    await sendWeeklyDigest();
    console.log('Weekly digest sent successfully');
  } catch (error) {
    console.error('Error sending weekly digest:', error);
  }
});

// Friday and Sunday 9 AM UTC: Check if backlog has at least 10 ideas
cron.schedule('0 9 * * 5,0', async () => {
  console.log('Running scheduled backlog health check...');
  try {
    await checkBacklogHealth();
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
  console.log(`📧 Cron jobs scheduled for weekly digest`);
});
