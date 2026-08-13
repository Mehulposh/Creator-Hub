import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Course } from '../models/Course.js';
import { retrieve } from '../services/rag.js';
import { getGroqClient, getGroqModel, isGroqConfigured } from '../services/groq.js';
import { applyCoupon } from './coupons.js';

export const storefrontRouter = Router();

storefrontRouter.get('/:slug', async (req, res, next) => {
  try {
    const lookup = mongoose.isValidObjectId(req.params.slug)
      ? { $or: [{ storeSlug: req.params.slug }, { _id: req.params.slug }] }
      : { storeSlug: req.params.slug };
    const creator = await User.findOne(lookup).select('name storeName storeSlug avatar bio themeColor socialLinks linkBlocks');
    if (!creator) return res.status(404).json({ message: 'Storefront not found' });
    const products = await Product.find({ creator: creator._id, status: 'published' }).select('title description price type coverColor sales');
    const courses = await Course.find({ creator: creator._id, status: 'published' }).select('title description price lessons enrolled');
    res.json({ creator, products, courses });
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
