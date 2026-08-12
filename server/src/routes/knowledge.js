import { Router } from 'express';
import { z } from 'zod';
import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { chunkText } from '../services/rag.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const knowledgeRouter = Router();
const schema = z.object({ title: z.string().min(2).max(160), content: z.string().min(20).max(50000) });
knowledgeRouter.use(requireAuth, requireCreator);
knowledgeRouter.get('/', async (req, res, next) => { try { res.json(await KnowledgeDocument.find({ creator: req.auth.sub }).select('title status chunks createdAt').sort({ createdAt: -1 })); } catch (error) { next(error); } });
knowledgeRouter.post('/', async (req, res, next) => { try { const input = schema.parse(req.body); const document = await KnowledgeDocument.create({ ...input, chunks: chunkText(input.content), creator: req.auth.sub }); res.status(201).json(document); } catch (error) { next(error); } });
knowledgeRouter.delete('/:id', async (req, res, next) => { try { const document = await KnowledgeDocument.findOneAndDelete({ _id: req.params.id, creator: req.auth.sub }); if (!document) return res.status(404).json({ message: 'Knowledge document not found' }); res.status(204).end(); } catch (error) { next(error); } });
