import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Course } from '../models/Course.js';
import { Membership } from '../models/Membership.js';
import { Bundle } from '../models/Bundle.js';
import { Funnel } from '../models/Funnel.js';
import { PageView } from '../models/PageView.js';
import { Appointment } from '../models/Appointment.js';
import { Contact } from '../models/Contact.js';
import { retrieve } from '../services/rag.js';
import { getGroqClient, getGroqModel, isGroqConfigured } from '../services/groq.js';
import { applyCoupon } from './coupons.js';
import { notifyCreator } from '../services/notifications.js';

export const storefrontRouter = Router();

const pageViewSchema = z.object({
  slug: z.string().min(1),
  path: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  source: z.enum(['store', 'funnel', 'direct']).optional()
});

storefrontRouter.post('/page-view', async (req, res, next) => {
  try {
    const input = pageViewSchema.parse(req.body);
    const lookup = mongoose.isValidObjectId(input.slug)
      ? { $or: [{ storeSlug: input.slug }, { _id: input.slug }] }
      : { storeSlug: input.slug };
    const creator = await User.findOne(lookup).select('_id');
    if (!creator) return res.status(404).json({ message: 'Store not found' });
    await PageView.create({
      creator: creator._id,
      path: input.path || '/',
      referrer: input.referrer || '',
      source: input.source || 'store'
    });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

storefrontRouter.get('/funnel/:slug', async (req, res, next) => {
  try {
    const funnel = await Funnel.findOne({ slug: req.params.slug.toLowerCase(), status: 'published' })
      .populate('creator', 'name storeName storeSlug themeColor bio');
    if (!funnel) return res.status(404).json({ message: 'Funnel not found' });
    funnel.visits += 1;
    await funnel.save();
    res.json(funnel);
  } catch (error) { next(error); }
});

storefrontRouter.post('/funnel/:slug/convert', async (req, res, next) => {
  try {
    const funnel = await Funnel.findOne({ slug: req.params.slug.toLowerCase(), status: 'published' });
    if (!funnel) return res.status(404).json({ message: 'Funnel not found' });
    funnel.conversions += 1;
    await funnel.save();
    res.json({ ok: true });
  } catch (error) { next(error); }
});

const leadCaptureSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(2).max(100),
  email: z.string().email().transform((v) => v.toLowerCase().trim())
});

storefrontRouter.post('/funnel/:slug/lead', async (req, res, next) => {
  try {
    const input = leadCaptureSchema.parse({ ...req.body, slug: req.params.slug });
    const funnel = await Funnel.findOne({ slug: input.slug.toLowerCase(), status: 'published' });
    if (!funnel) return res.status(404).json({ message: 'Funnel not found' });
    await Contact.findOneAndUpdate(
      { creator: funnel.creator, email: input.email },
      { $set: { name: input.name, status: 'lead' }, $setOnInsert: { creator: funnel.creator } },
      { upsert: true }
    );
    funnel.conversions += 1;
    await funnel.save();
    res.json({ message: 'Thanks! We will be in touch.' });
  } catch (error) { next(error); }
});

const bookSessionSchema = z.object({
  slug: z.string().min(1),
  clientName: z.string().min(2).max(100),
  clientEmail: z.string().email().transform((v) => v.toLowerCase().trim()),
  startsAt: z.coerce.date(),
  duration: z.coerce.number().min(15).max(480).optional(),
  notes: z.string().max(1000).optional(),
  title: z.string().min(2).max(120).optional()
});

storefrontRouter.post('/book-session', async (req, res, next) => {
  try {
    const input = bookSessionSchema.parse(req.body);
    const lookup = mongoose.isValidObjectId(input.slug)
      ? { $or: [{ storeSlug: input.slug }, { _id: input.slug }] }
      : { storeSlug: input.slug };
    const creator = await User.findOne(lookup);
    if (!creator) return res.status(404).json({ message: 'Store not found' });

    if (input.startsAt <= new Date()) {
      return res.status(400).json({ message: 'Please choose a future date and time.' });
    }

    const appointment = await Appointment.create({
      creator: creator._id,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      title: input.title || '1-on-1 Session',
      startsAt: input.startsAt,
      duration: input.duration || 60,
      notes: input.notes || '',
      status: 'pending',
      source: 'store'
    });

    await Contact.findOneAndUpdate(
      { creator: creator._id, email: input.clientEmail },
      { $set: { name: input.clientName, status: 'lead' }, $setOnInsert: { creator: creator._id } },
      { upsert: true }
    );

    await notifyCreator(creator._id, {
      title: 'New session request',
      message: `${input.clientName} requested a session on ${new Date(input.startsAt).toLocaleString()}.`,
      type: 'system'
    });

    res.status(201).json({
      message: 'Session request sent! You will be notified once the creator confirms.',
      appointmentId: appointment._id
    });
  } catch (error) { next(error); }
});

storefrontRouter.get('/:slug', async (req, res, next) => {
  try {
    const lookup = mongoose.isValidObjectId(req.params.slug)
      ? { $or: [{ storeSlug: req.params.slug }, { _id: req.params.slug }] }
      : { storeSlug: req.params.slug };
    const creator = await User.findOne(lookup).select('name storeName storeSlug avatar bio themeColor socialLinks linkBlocks seoTitle seoDescription fontFamily');
    if (!creator) return res.status(404).json({ message: 'Storefront not found' });
    const [products, courses, memberships, bundles] = await Promise.all([
      Product.find({ creator: creator._id, status: 'published' }).select('title description price type coverColor sales fileFilename licenseType'),
      Course.find({ creator: creator._id, status: 'published' }).select('title description price lessons enrolled'),
      Membership.find({ creator: creator._id, status: 'published' }).select('name description price interval perks members'),
      Bundle.find({ creator: creator._id, status: 'published' }).select('title description price productIds courseIds coverColor sales')
    ]);
    await PageView.create({ creator: creator._id, path: `/store/${req.params.slug}`, source: 'store' });
    res.json({ creator, products, courses, memberships, bundles });
  } catch (error) { next(error); }
});

const supportSchema = z.object({ slug: z.string().min(1), message: z.string().min(1).max(2000) });
const validateCouponSchema = z.object({
  slug: z.string().min(1),
  code: z.string().min(1).max(20),
  subtotal: z.coerce.number().min(0)
});

storefrontRouter.post('/validate-coupon', async (req, res, next) => {
  try {
    const { slug, code, subtotal } = validateCouponSchema.parse(req.body);
    const lookup = mongoose.isValidObjectId(slug) ? { $or: [{ storeSlug: slug }, { _id: slug }] } : { storeSlug: slug };
    const creator = await User.findOne(lookup);
    if (!creator) return res.status(404).json({ message: 'Store not found' });
    const result = await applyCoupon(creator._id, code, subtotal);
    const discount = Math.round((subtotal - result.amount) * 100) / 100;
    res.json({
      valid: true,
      code: result.coupon.code,
      subtotal,
      discount,
      total: result.amount,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue
    });
  } catch (error) {
    if (error.message?.includes('coupon') || error.message?.includes('Coupon')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

storefrontRouter.post('/support', async (req, res, next) => {
  try {
    const { slug, message } = supportSchema.parse(req.body);
    const lookup = mongoose.isValidObjectId(slug) ? { $or: [{ storeSlug: slug }, { _id: slug }] } : { storeSlug: slug };
    const creator = await User.findOne(lookup);
    if (!creator) return res.status(404).json({ message: 'Store not found' });
    if (!isGroqConfigured()) return res.status(503).json({ message: 'Support assistant is not available' });
    const sources = await retrieve(creator._id, message);
    const context = sources.length ? sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.content}`).join('\n\n') : 'No matching knowledge found.';
    const ai = getGroqClient();
    const response = await ai.chat.completions.create({
      model: getGroqModel(),
      messages: [
        { role: 'system', content: `You are a helpful customer support assistant for ${creator.storeName || creator.name}. Answer from the knowledge below. Be friendly and concise.\n\nKNOWLEDGE:\n${context}` },
        { role: 'user', content: message }
      ]
    });
    const content = response.choices[0]?.message.content || 'Sorry, I could not answer that.';
    res.json({ content, sources: [...new Set(sources.map((s) => s.title))] });
  } catch (error) { next(error); }
});
