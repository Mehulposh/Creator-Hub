import { Router } from 'express';
import { z } from 'zod';
import { AiConversation } from '../models/AiConversation.js';
import { retrieve } from '../services/rag.js';
import { getGroqClient, getGroqModel } from '../services/groq.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const aiStudioRouter = Router();
const messageSchema = z.object({ 
  message: z.string().min(1).max(8000), 
  conversationId: z.string().optional()
});

const agentSchema = messageSchema.extend({ 
  agent: z.enum(['content', 'marketing', 'sales', 'support', 'analytics', 'advisor']) 
});

const agentPrompts = { 
  content: 'You are a content strategist. Create useful, distinct content that respects the creator’s voice.',
  marketing: 'You are a growth marketer. Prioritize specific campaigns, audience insight, and measurable next steps.', 
  sales: 'You are a sales strategist. Create ethical, clear conversion-focused recommendations and copy.', 
  support: 'You are customer support. Answer only from supplied knowledge when available and be transparent about gaps.', 
  analytics: 'You are a business analyst. Translate metrics into practical decisions without inventing data.', 
  advisor: 'You are a pragmatic creator business advisor. Give focused strategy, priorities, and tradeoffs.' 
};


function client() {
  return getGroqClient();
}

async function respond({ creator, message, conversationId, kind, agent }) {
  const sources = await retrieve(creator, message); 
  const context = sources.length 
  ? sources.map((source, index) => `[${index + 1}] ${source.title}\n${source.content}`).join('\n\n') 
  : 'No matching creator knowledge was found.';

  const conversation = conversationId 
  ? await AiConversation.findOne({ _id: conversationId, creator }) 
  : await AiConversation.create({ creator, kind, agent, messages: [] });

  if (!conversation) 
    throw new Error('Conversation not found');

  const system = `${agent ? agentPrompts[agent] 
  : 'You are the AI Creator Hub assistant.'} Use the retrieved creator knowledge below when it is relevant. Do not claim the sources say something they do not. If knowledge is missing, say so plainly.\n\nKNOWLEDGE:\n${context}`;

  const history = conversation.messages.slice(-8).map(
    (item) => ({ role: item.role, content: item.content })
  );

  const completion = await client().chat.completions.create(
    {
     model: getGroqModel(), 
     messages: [{ 
      role: 'system', 
      content: system }, 
      ...history, 
      { 
        role: 'user', 
        content: message 
      }] 
    }
  );


  const content = completion.choices[0]?.message.content || 'I could not generate a response.'; 
  
  const sourceTitles = [...new Set(sources.map((source) => source.title))];
  
  conversation.messages.push({ 
    role: 'user', 
    content: message 
  }, 
  { 
    role: 'assistant', 
    content, 
    sources: sourceTitles 
  }); 
  
  await conversation.save();
  return { 
    conversationId: conversation.id, 
    content, 
    sources: sourceTitles 
  };
}

aiStudioRouter.use(requireAuth, requireCreator);
aiStudioRouter.post('/chat', async (req, res, next) => { 
  try { 
    res.json(
      await respond({ 
        creator: req.auth.sub, 
        ...messageSchema.parse(req.body), 
        kind: 'assistant' 
      })); 
    }catch (error) { 
      next(error); 
    } 
  });

aiStudioRouter.post('/support', async (req, res, next) => { 
  try { 
    res.json(
      await respond({ 
        creator: req.auth.sub, 
        ...messageSchema.parse(req.body), 
        kind: 'support', 
        agent: 'support' 
      })); 
    }catch (error) { 
      next(error); 
    } 
  });


aiStudioRouter.post('/agents/run', async (req, res, next) => { 
  try { 
    const input = agentSchema.parse(req.body); 
    res.json(
      await respond({ 
        creator: req.auth.sub, 
        ...input, 
        kind: 'agent' 
      })); 
    } catch (error) { 
      next(error); 
    } 
});
