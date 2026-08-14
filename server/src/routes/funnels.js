import { Router } from 'express';
import { z } from 'zod';
import { Funnel } from '../models/Funnel.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const funnelRouter = Router();
const stepSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(['landing', 'lead_capture', 'checkout', 'upsell', 'thank_you']).optional(),
  content: z.string().max(10000).optional()
});
const schema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'published']).optional(),
  slug: z.string().min(3).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  steps: z.array(stepSchema).max(10).optional()
});

funnelRouter.use(requireAuth, requireCreator);
funnelRouter.get('/', async (req, res, next) => {
  try { res.json(await Funnel.find({ creator: req.auth.sub }).sort({ createdAt: -1 })); } catch (error) { next(error); }
});
funnelRouter.post('/', async (req, res, next) => {
  try { res.status(201).json(await Funnel.create({ ...schema.parse(req.body), creator: req.auth.sub })); } catch (error) { next(error); }
});
funnelRouter.patch('/:id', async (req, res, next) => {
  try {
    const funnel = await Funnel.findOneAndUpdate({ _id: req.params.id, creator: req.auth.sub }, schema.partial().parse(req.body), { new: true });
    if (!funnel) return res.status(404).json({ message: 'Funnel not found' });
    res.json(funnel);
  } catch (error) { next(error); }
});
funnelRouter.delete('/:id', async (req, res, next) => {
  try {
    const funnel = await Funnel.findOneAndDelete({ _id: req.params.id, creator: req.auth.sub });
    if (!funnel) return res.status(404).json({ message: 'Funnel not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});
