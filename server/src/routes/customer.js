import { Router } from 'express';
import { z } from 'zod';
import { Order } from '../models/Order.js';
import { Appointment } from '../models/Appointment.js';
import { CustomerLoginCode } from '../models/CustomerLoginCode.js';
import { customerTokenFor, requireCustomerAuth } from '../middleware/customerAuth.js';
import { sendEmail } from '../services/email.js';

export const customerRouter = Router();

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function emailHasLibrary(email) {
  const normalized = email.toLowerCase();
  const [orders, sessions] = await Promise.all([
    Order.exists({ buyerEmail: normalized, status: 'paid' }),
    Appointment.exists({ clientEmail: normalized })
  ]);
  return Boolean(orders || sessions);
}

function mapPurchase(order) {
  const isProduct = order.itemType === 'product';
  const item = isProduct ? order.product : order.course;
  return {
    _id: order._id,
    itemType: order.itemType,
    title: item?.title || 'Purchase',
    description: item?.description || '',
    amount: order.amount,
    createdAt: order.createdAt,
    creatorName: order.creator?.storeName || order.creator?.name || 'Creator',
    storeSlug: order.creator?.storeSlug,
    downloadToken: order.downloadToken,
    hasDownload: isProduct && Boolean(order.product?.downloadUrl),
    downloadLimit: order.product?.downloadLimit || 5,
    downloadCount: order.downloadCount,
    downloadRemaining: isProduct ? Math.max(0, (order.product?.downloadLimit || 5) - order.downloadCount) : 0,
    lessons: order.course?.lessons || [],
    coverColor: order.product?.coverColor
  };
}

function mapSession(appointment) {
  return {
    _id: appointment._id,
    title: appointment.title,
    clientName: appointment.clientName,
    startsAt: appointment.startsAt,
    duration: appointment.duration,
    status: appointment.status,
    notes: appointment.notes || '',
    creatorName: appointment.creator?.storeName || appointment.creator?.name || 'Creator',
    storeSlug: appointment.creator?.storeSlug
  };
}

async function fetchLibrary(email) {
  const normalized = email.toLowerCase();
  const [orders, appointments] = await Promise.all([
    Order.find({ buyerEmail: normalized, status: 'paid' })
      .populate('product', 'title description downloadUrl downloadLimit type coverColor')
      .populate('course', 'title description lessons price')
      .populate('creator', 'name storeName storeSlug')
      .sort({ createdAt: -1 }),
    Appointment.find({ clientEmail: normalized })
      .populate('creator', 'name storeName storeSlug')
      .sort({ startsAt: -1 })
  ]);

  const purchases = orders.map(mapPurchase);
  return {
    email: normalized,
    products: purchases.filter((p) => p.itemType === 'product'),
    courses: purchases.filter((p) => p.itemType === 'course'),
    sessions: appointments.map(mapSession),
    stats: {
      products: purchases.filter((p) => p.itemType === 'product').length,
      courses: purchases.filter((p) => p.itemType === 'course').length,
      sessions: appointments.length
    }
  };
}

const requestLoginSchema = z.object({ email: z.string().email() });
const verifyLoginSchema = z.object({ email: z.string().email(), code: z.string().length(6) });

customerRouter.post('/request-login', async (req, res, next) => {
  try {
    const { email } = requestLoginSchema.parse(req.body);
    const normalized = email.toLowerCase();

    if (!(await emailHasLibrary(normalized))) {
      return res.status(404).json({ message: 'No purchases or sessions found for this email.' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await CustomerLoginCode.deleteMany({ email: normalized });
    await CustomerLoginCode.create({ email: normalized, code, expiresAt });

    await sendEmail({
      to: normalized,
      subject: 'Your Creator Hub sign-in code',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px"><h2>Sign in to your library</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes.</p></div>`
    });

    const simulated = !process.env.SMTP_HOST;
    res.json({
      message: simulated
        ? 'Demo mode — use the code shown below (also logged on the server).'
        : 'We sent a 6-digit code to your email.',
      simulated,
      ...(simulated ? { debugCode: code } : {})
    });
  } catch (error) { next(error); }
});

customerRouter.post('/verify-login', async (req, res, next) => {
  try {
    const { email, code } = verifyLoginSchema.parse(req.body);
    const normalized = email.toLowerCase();

    const record = await CustomerLoginCode.findOne({ email: normalized, code });
    if (!record || record.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired code. Request a new one.' });
    }

    await CustomerLoginCode.deleteMany({ email: normalized });
    const library = await fetchLibrary(normalized);

    res.json({
      token: customerTokenFor(normalized),
      customer: { email: normalized, ...library.stats },
      library
    });
  } catch (error) { next(error); }
});

customerRouter.get('/library', requireCustomerAuth, async (req, res, next) => {
  try {
    res.json(await fetchLibrary(req.customerEmail));
  } catch (error) { next(error); }
});

customerRouter.get('/me', requireCustomerAuth, async (req, res, next) => {
  try {
    const library = await fetchLibrary(req.customerEmail);
    res.json({ email: req.customerEmail, stats: library.stats });
  } catch (error) { next(error); }
});
