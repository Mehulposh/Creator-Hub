import { Router } from 'express';
import { z } from 'zod';
import { Coupon } from '../models/Coupon.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const couponRouter = Router();
const schema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9-]+$/i),
  discountType: z.enum(['percent', 'fixed']).optional(),
  discountValue: z.coerce.number().min(0),
  maxUses: z.coerce.number().min(0).optional(),
  expiresAt: z.coerce.date().optional(),
  active: z.boolean().optional()
});

couponRouter.use(requireAuth, requireCreator);
couponRouter.get('/', async (req, res, next) => {
  try { res.json(await Coupon.find({ creator: req.auth.sub }).sort({ createdAt: -1 })); } catch (error) { next(error); }
});
couponRouter.post('/', async (req, res, next) => {
  try {
    const input = schema.parse(req.body);
    const existing = await Coupon.findOne({ creator: req.auth.sub, code: input.code.toUpperCase() });
    if (existing) return res.status(409).json({ message: 'Coupon code already exists' });
    res.status(201).json(await Coupon.create({ ...input, code: input.code.toUpperCase(), creator: req.auth.sub }));
  } catch (error) { next(error); }
});
couponRouter.patch('/:id', async (req, res, next) => {
  try {
    const coupon = await Coupon.findOneAndUpdate({ _id: req.params.id, creator: req.auth.sub }, schema.partial().parse(req.body), { new: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (error) { next(error); }
});
couponRouter.delete('/:id', async (req, res, next) => {
  try {
    const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, creator: req.auth.sub });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});

export async function applyCoupon(creator, code, amount) {
  if (!code) return { amount, coupon: null };
  const coupon = await Coupon.findOne({ creator, code: code.toUpperCase(), active: true });
  if (!coupon) throw new Error('Invalid coupon code');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error('Coupon has expired');
  if (coupon.maxUses && coupon.uses >= coupon.maxUses) throw new Error('Coupon usage limit reached');
  const discount = coupon.discountType === 'fixed'
    ? Math.min(coupon.discountValue, amount)
    : Math.round(amount * coupon.discountValue) / 100;
  return { amount: Math.max(0, amount - discount), coupon };
}
