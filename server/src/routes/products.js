import { Router } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const productRouter = Router();
const productSchema = z.object({
  title: z.string().min(2).max(120), description: z.string().max(2000).optional(), price: z.coerce.number().min(0),
  type: z.enum(['digital_download', 'template', 'course', 'membership', 'coaching']).optional(),
  status: z.enum(['draft', 'published']).optional(), coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  downloadUrl: z.string().url().optional().or(z.literal('')).transform((v) => v || undefined),
  downloadLimit: z.coerce.number().min(1).max(100).optional()
});

productRouter.use(requireAuth, requireCreator);
productRouter.get('/', async (req, res, next) => {
  try { res.json(await Product.find({ creator: req.auth.sub }).sort({ createdAt: -1 })); } catch (error) { next(error); }
});
productRouter.post('/', async (req, res, next) => {
  try { res.status(201).json(await Product.create({ ...productSchema.parse(req.body), creator: req.auth.sub })); } catch (error) { next(error); }
});
productRouter.patch('/:id', async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate({ _id: req.params.id, creator: req.auth.sub }, productSchema.partial().parse(req.body), { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) { next(error); }
});
productRouter.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, creator: req.auth.sub });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});
