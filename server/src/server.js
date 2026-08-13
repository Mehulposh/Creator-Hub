import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.js';
import { aiRouter } from './routes/ai.js';
import { productRouter } from './routes/products.js';
import { contactRouter } from './routes/contacts.js';
import { appointmentRouter } from './routes/appointments.js';
import { campaignRouter } from './routes/campaigns.js';
import { analyticsRouter } from './routes/analytics.js';
import { learningRouter } from './routes/learning.js';
import { communityRouter } from './routes/community.js';
import { knowledgeRouter } from './routes/knowledge.js';
import { aiStudioRouter } from './routes/aiStudio.js';
import { aiGeneratorRouter } from './routes/aiGenerators.js';
import { storefrontRouter } from './routes/storefront.js';
import { commerceRouter, handleStripeWebhook } from './routes/commerce.js';
import { settingsRouter } from './routes/settings.js';
import { adminRouter } from './routes/admin.js';
import { couponRouter } from './routes/coupons.js';
import { affiliateRouter } from './routes/affiliates.js';
import { funnelRouter } from './routes/funnels.js';
import { automationRouter } from './routes/automations.js';
import { customerRouter } from './routes/customer.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173' }));

app.post('/api/commerce/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    await handleStripeWebhook(req.body, sig);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/api/products', productRouter);
app.use('/api/contacts', contactRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/learning', learningRouter);
app.use('/api/community', communityRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/ai-studio', aiStudioRouter);
app.use('/api/ai-generators', aiGeneratorRouter);
app.use('/api/storefront', storefrontRouter);
app.use('/api/commerce', commerceRouter);
app.use('/api/coupons', couponRouter);
app.use('/api/affiliates', affiliateRouter);
app.use('/api/funnels', funnelRouter);
app.use('/api/automations', automationRouter);
app.use('/api/customer', customerRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminRouter);
app.use((error, _req, res, _next) => {
  if (error.name === 'ZodError') return res.status(400).json({ message: error.issues[0]?.message || 'Invalid request' });
  console.error(error);
  res.status(500).json({ message: 'Something went wrong' });
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}
start().catch((error) => { console.error(error); process.exit(1); });
