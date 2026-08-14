import { Router } from 'express';
import { z } from 'zod';
import { Bundle } from '../models/Bundle.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const bundleRouter = Router();

const schema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().min(0),
  productIds: z.array(z.string()).max(20).optional(),
  courseIds: z.array(z.string()).max(20).optional(),
  coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  status: z.enum(['draft', 'published']).optional()
});

bundleRouter.use(requireAuth, requireCreator);

bundleRouter.get('/', async (req, res, next) => {
  try {
    res.json(await Bundle.find({ creator: req.auth.sub }).sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});

bundleRouter.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await Bundle.create({ ...schema.parse(req.body), creator: req.auth.sub }));
  } catch (error) { next(error); }
});

bundleRouter.patch('/:id', async (req, res, next) => {
  try {
    const bundle = await Bundle.findOneAndUpdate(
      { _id: req.params.id, creator: req.auth.sub },
      schema.partial().parse(req.body),
      { new: true }
    );
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });
    res.json(bundle);
  } catch (error) { next(error); }
});

bundleRouter.delete('/:id', async (req, res, next) => {
  try {
    const bundle = await Bundle.findOneAndDelete({ _id: req.params.id, creator: req.auth.sub });
    if (!bundle) return res.status(404).json({ message: 'Bundle not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});
