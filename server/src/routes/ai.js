import { Router } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const aiRouter = Router();
const requestSchema = z.object({ prompt: z.string().min(1).max(8000), context: z.string().max(4000).optional() });
aiRouter.post('/generate', requireAuth, requireCreator, async (req, res, next) => {
  try {
    if (!process.env.XAI_API_KEY) return res.status(503).json({ message: 'Grok is not configured. Add XAI_API_KEY to .env.' });
    const { prompt, context } = requestSchema.parse(req.body);
    const grok = new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' });
    const response = await grok.chat.completions.create({ model: process.env.XAI_MODEL || 'grok-2-latest', messages: [
      { role: 'system', content: 'You are the AI Creator Hub assistant. Give practical creator-business guidance.' },
      { role: 'user', content: `${context ? `Creator context:\n${context}\n\n` : ''}${prompt}` }
    ] });
    res.json({ content: response.choices[0]?.message.content || '' });
  } catch (error) { next(error); }
});
