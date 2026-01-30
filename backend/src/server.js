import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Routes
import ideasRouter from './routes/ideas.js';
import votesRouter from './routes/votes.js';
import authRouter from './routes/auth.js';
import webhookRouter from './routes/webhook.js';
import adminRouter from './routes/admin.js';

// Jobs
import { calculateWinner, sendWeeklyDigest, sendBadgeEmails } from './jobs/weekly.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
app.use('/api/webhook', webhookRouter);
app.use('/api/admin', adminRouter);

// Cron Jobs
// Sunday 11 PM UTC: Calculate winner and prepare badges
cron.schedule('0 23 * * 0', async () => {
  console.log('Running weekly winner calculation...');
  try {
    await calculateWinner();
    console.log('Winner calculated successfully');
  } catch (error) {
    console.error('Error calculating winner:', error);
  }
});

// Monday 9 AM UTC: Send weekly digest
cron.schedule('0 9 * * 1', async () => {
  console.log('Sending weekly digest...');
  try {
    await sendWeeklyDigest();
    console.log('Weekly digest sent successfully');
  } catch (error) {
    console.error('Error sending weekly digest:', error);
  }
});

// Monday 9:15 AM UTC: Send badge emails (after digest)
cron.schedule('15 9 * * 1', async () => {
  console.log('Sending badge emails...');
  try {
    await sendBadgeEmails();
    console.log('Badge emails sent successfully');
  } catch (error) {
    console.error('Error sending badge emails:', error);
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
  console.log(`📧 Cron jobs scheduled for valid digest and badges`);
});
