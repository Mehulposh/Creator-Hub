import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';
import { getGroqClient, getGroqModel, isGroqConfigured } from '../services/groq.js';

export const aiRouter = Router();
const requestSchema = z.object({ prompt: z.string().min(1).max(8000), context: z.string().max(4000).optional() });

aiRouter.post('/generate', requireAuth, requireCreator, async (req, res, next) => {
  try {
    if (!isGroqConfigured()) return res.status(503).json({ message: 'AI is not configured. Add GROQ_API_KEY to .env.' });
    const { prompt, context } = requestSchema.parse(req.body);
    const ai = getGroqClient();
    const response = await ai.chat.completions.create({
      model: getGroqModel(),
      messages: [
        { role: 'system', content: 'You are the AI Creator Hub assistant. Give practical creator-business guidance.' },
        { role: 'user', content: `${context ? `Creator context:\n${context}\n\n` : ''}${prompt}` }
      ]
    });
    res.json({ content: response.choices[0]?.message.content || '' });
  } catch (error) { next(error); }
});
