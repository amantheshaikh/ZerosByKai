import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Routes
import ideasRouter from './routes/ideas.js';
import votesRouter from './routes/votes.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';

// Jobs
import { autoPublishIdeas, calculateWinner, sendWeeklyDigest } from './jobs/weekly.js';
import { runRedditFlow } from './workflows/daily_startup_ideas.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://zerosbykai.vercel.app',
  'https://zerosbykai.com',
  'https://www.zerosbykai.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
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
app.use('/api/admin', adminRouter);

// Newsletter subscribe shortcut (maps to /api/auth/subscribe)
app.post('/api/subscribe', (req, res, next) => {
  req.url = '/subscribe';
  authRouter(req, res, next);
});

// Cron Jobs
// Sunday 10 AM UTC: Scrape Reddit, stage ideas as pending for review
cron.schedule('0 10 * * 0', async () => {
  console.log('Running Reddit startup ideas workflow...');
  try {
    await runRedditFlow();
    console.log('Reddit workflow completed');
  } catch (error) {
    console.error('Error running Reddit workflow:', error);
  }
});

// Monday 9 AM UTC: Auto-publish, calculate winner, send weekly digest (sequential)
cron.schedule('0 9 * * 1', async () => {
  console.log('Auto-publishing pending ideas...');
  try {
    await autoPublishIdeas();
    console.log('Auto-publish completed');
  } catch (error) {
    console.error('Error auto-publishing ideas:', error);
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

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ZerosByKai API running on port ${PORT}`);
  console.log(`📧 Cron jobs scheduled for weekly digest`);
});
