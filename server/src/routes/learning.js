import { Router } from 'express';
import { z } from 'zod';
import { Course } from '../models/Course.js';
import { Membership } from '../models/Membership.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const learningRouter = Router();
const optionalUrl = z.string().url().optional().or(z.literal('')).transform((v) => v || undefined);
const lessonSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(2).max(180),
  content: z.string().max(20000).optional(),
  duration: z.coerce.number().min(1).max(600).optional(),
  isPreview: z.boolean().optional(),
  pdfUrl: optionalUrl,
  pdfFilename: z.string().max(255).optional(),
  meetLink: optionalUrl
});
const courseSchema = z.object({ title: z.string().min(2).max(140), description: z.string().max(3000).optional(), price: z.coerce.number().min(0).optional(), status: z.enum(['draft', 'published']).optional(), lessons: z.array(lessonSchema).max(100).optional() });
const membershipSchema = z.object({ name: z.string().min(2).max(100), description: z.string().max(2000).optional(), price: z.coerce.number().min(0), interval: z.enum(['monthly', 'annual']).optional(), perks: z.array(z.string().max(140)).max(20).optional(), status: z.enum(['draft', 'published']).optional() });
learningRouter.use(requireAuth, requireCreator);
for (const [path, Model, schema] of [['/courses', Course, courseSchema], ['/memberships', Membership, membershipSchema]]) {
  learningRouter.get(path, async (req, res, next) => { try { res.json(await Model.find({ creator: req.auth.sub }).sort({ createdAt: -1 })); } catch (error) { next(error); } });
  learningRouter.post(path, async (req, res, next) => { try { res.status(201).json(await Model.create({ ...schema.parse(req.body), creator: req.auth.sub })); } catch (error) { next(error); } });
  learningRouter.patch(`${path}/:id`, async (req, res, next) => { try { const item = await Model.findOneAndUpdate({ _id: req.params.id, creator: req.auth.sub }, schema.partial().parse(req.body), { new: true }); if (!item) return res.status(404).json({ message: 'Item not found' }); res.json(item); } catch (error) { next(error); } });
  learningRouter.delete(`${path}/:id`, async (req, res, next) => { try { const item = await Model.findOneAndDelete({ _id: req.params.id, creator: req.auth.sub }); if (!item) return res.status(404).json({ message: 'Item not found' }); res.status(204).end(); } catch (error) { next(error); } });
}
