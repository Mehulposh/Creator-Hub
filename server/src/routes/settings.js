import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const settingsRouter = Router();
const linkBlockSchema = z.object({ label: z.string().min(1).max(80), url: z.string().url(), icon: z.string().optional(), order: z.number().optional() });
const profileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  storeName: z.string().min(2).max(100).optional(),
  storeSlug: z.string().min(3).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens only').optional(),
  bio: z.string().max(500).optional(),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  socialLinks: z.object({ instagram: z.string().optional(), twitter: z.string().optional(), youtube: z.string().optional(), tiktok: z.string().optional(), website: z.string().optional() }).optional(),
  linkBlocks: z.array(linkBlockSchema).max(20).optional()
});

settingsRouter.use(requireAuth, requireCreator);
settingsRouter.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub).select('name email role storeName storeSlug avatar bio themeColor socialLinks linkBlocks');
    if (!user) return res.status(404).json({ message: 'Profile not found' });
    res.json(user);
  } catch (error) { next(error); }
});
settingsRouter.patch('/profile', async (req, res, next) => {
  try {
    const input = profileSchema.parse(req.body);
    if (input.storeSlug && await User.exists({ storeSlug: input.storeSlug, _id: { $ne: req.auth.sub } })) {
      return res.status(409).json({ message: 'That storefront URL is already taken' });
    }
    const user = await User.findByIdAndUpdate(req.auth.sub, input, { new: true }).select('name email role storeName storeSlug avatar bio themeColor socialLinks linkBlocks');
    res.json(user);
  } catch (error) { next(error); }
});
