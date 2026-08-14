import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';
import { retrieve } from '../services/rag.js';
import { getGroqClient, getGroqModel } from '../services/groq.js';

export const aiGeneratorRouter = Router();
const requestSchema = z.object({ prompt: z.string().min(1).max(4000), context: z.string().max(4000).optional() });

function client() {
  return getGroqClient();
}

async function generate(systemPrompt, userPrompt) {
  const response = await client().chat.completions.create({
    model: getGroqModel(),
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]
  });
  return response.choices[0]?.message.content || '';
}

aiGeneratorRouter.use(requireAuth, requireCreator);

aiGeneratorRouter.post('/content', async (req, res, next) => {
  try {
    const { prompt, context, contentType } = z.object({
      prompt: z.string().min(1).max(4000),
      context: z.string().max(4000).optional(),
      contentType: z.string().optional()
    }).parse(req.body);
    const typePrompts = {
      blog: 'Write a complete blog post with title, intro, sections, and conclusion.',
      social: 'Write social media captions for Instagram, Twitter/X, and LinkedIn.',
      email: 'Write a marketing email with subject line, preview text, and body.',
      landing: 'Write landing page copy with headline, subheadline, benefits, and CTA.',
      sales: 'Write persuasive sales copy with hook, pain points, solution, and close.',
      course: 'Write a detailed course outline with modules and lesson titles.',
      script: 'Write a video/podcast script with intro, main points, and outro.'
    };
    const instruction = typePrompts[contentType] || 'Write creator-ready content.';
    const content = await generate(
      `You are an AI content studio for creators. ${instruction} Return well-formatted markdown.`,
      `${context ? `Context: ${context}\n` : ''}Request: ${prompt}`
    );
    res.json({ content, contentType: contentType || 'general' });
  } catch (error) { next(error); }
});

aiGeneratorRouter.post('/product', async (req, res, next) => {
  try {
    const { prompt, context } = requestSchema.parse(req.body);
    const sources = await retrieve(req.auth.sub, prompt);
    const knowledge = sources.map((s) => s.content).join('\n');
    const content = await generate(
      'You are an AI product generator for creators. Return structured JSON with keys: title, description, features (array), pricingSuggestion, salesPage, faqs (array), seoKeywords (array).',
      `${context ? `Context: ${context}\n` : ''}${knowledge ? `Knowledge:\n${knowledge}\n` : ''}Product idea: ${prompt}`
    );
    try { res.json({ content, structured: JSON.parse(content.replace(/```json\n?|\n?```/g, '')) }); }
    catch { res.json({ content }); }
  } catch (error) { next(error); }
});

aiGeneratorRouter.post('/website', async (req, res, next) => {
  try {
    const { prompt, context } = requestSchema.parse(req.body);
    const content = await generate(
      'You are an AI website builder for creators. Generate complete HTML for a single-page site. Include inline CSS. Make it mobile-responsive and modern. Return only HTML.',
      `${context ? `Brand context: ${context}\n` : ''}Build a page for: ${prompt}`
    );
    res.json({ content, html: content.replace(/```html\n?|\n?```/g, '') });
  } catch (error) { next(error); }
});

aiGeneratorRouter.post('/branding', async (req, res, next) => {
  try {
    const { prompt, context } = requestSchema.parse(req.body);
    const content = await generate(
      'You are an AI branding expert. Return structured JSON with keys: brandName, tagline, colorPalette (array of hex codes), typography (object with heading and body fonts), brandVoice, guidelines (array), socialBannerIdeas (array).',
      `${context ? `Existing brand: ${context}\n` : ''}Brand brief: ${prompt}`
    );
    try { res.json({ content, structured: JSON.parse(content.replace(/```json\n?|\n?```/g, '')) }); }
    catch { res.json({ content }); }
  } catch (error) { next(error); }
});
