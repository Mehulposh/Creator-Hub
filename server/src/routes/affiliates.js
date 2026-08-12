import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { Affiliate } from '../models/Affiliate.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const affiliateRouter = Router();
const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  code: z.string().min(3).max(20).regex(/^[A-Z0-9-]+$/i),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(['active', 'paused']).optional()
});

affiliateRouter.use(requireAuth, requireCreator);
affiliateRouter.get('/', async (req, res, next) => {
  try { res.json(await Affiliate.find({ creator: req.auth.sub }).sort({ createdAt: -1 })); } catch (error) { next(error); }
});
affiliateRouter.post('/', async (req, res, next) => {
  try {
    const input = schema.parse(req.body);
    const code = input.code.toUpperCase();
    if (await Affiliate.exists({ creator: req.auth.sub, code })) return res.status(409).json({ message: 'Affiliate code already exists' });
    res.status(201).json(await Affiliate.create({ ...input, code, creator: req.auth.sub }));
  } catch (error) { next(error); }
});
affiliateRouter.patch('/:id', async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOneAndUpdate({ _id: req.params.id, creator: req.auth.sub }, schema.partial().parse(req.body), { new: true });
    if (!affiliate) return res.status(404).json({ message: 'Affiliate not found' });
    res.json(affiliate);
  } catch (error) { next(error); }
});
affiliateRouter.delete('/:id', async (req, res, next) => {
  try {
    const affiliate = await Affiliate.findOneAndDelete({ _id: req.params.id, creator: req.auth.sub });
    if (!affiliate) return res.status(404).json({ message: 'Affiliate not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});

export async function trackAffiliateReferral(creator, code, saleAmount) {
  if (!code) return;
  const affiliate = await Affiliate.findOne({ creator, code: code.toUpperCase(), status: 'active' });
  if (!affiliate) return;
  const commission = Math.round(saleAmount * affiliate.commissionRate) / 100;
  affiliate.referrals += 1;
  affiliate.earnings += commission;
  await affiliate.save();
}

export function generateReferralCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}
