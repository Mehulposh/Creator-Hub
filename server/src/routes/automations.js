import { Router } from 'express';
import { z } from 'zod';
import { Automation } from '../models/Automation.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const automationRouter = Router();
const schema = z.object({
  name: z.string().min(2).max(100),
  trigger: z.enum(['new_subscriber', 'new_customer', 'new_sale', 'booking_confirmed']).optional(),
  action: z.enum(['send_email', 'add_tag', 'notify']).optional(),
  template: z.string().max(5000).optional(),
  active: z.boolean().optional()
});

automationRouter.use(requireAuth, requireCreator);
automationRouter.get('/', async (req, res, next) => {
  try { res.json(await Automation.find({ creator: req.auth.sub }).sort({ createdAt: -1 })); } catch (error) { next(error); }
});
automationRouter.post('/', async (req, res, next) => {
  try { res.status(201).json(await Automation.create({ ...schema.parse(req.body), creator: req.auth.sub })); } catch (error) { next(error); }
});
automationRouter.patch('/:id', async (req, res, next) => {
  try {
    const automation = await Automation.findOneAndUpdate({ _id: req.params.id, creator: req.auth.sub }, schema.partial().parse(req.body), { new: true });
    if (!automation) return res.status(404).json({ message: 'Automation not found' });
    res.json(automation);
  } catch (error) { next(error); }
});
automationRouter.delete('/:id', async (req, res, next) => {
  try {
    const automation = await Automation.findOneAndDelete({ _id: req.params.id, creator: req.auth.sub });
    if (!automation) return res.status(404).json({ message: 'Automation not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});

export async function runAutomations(creator, trigger, context = {}) {
  const automations = await Automation.find({ creator, trigger, active: true });
  for (const automation of automations) {
    automation.runs += 1;
    await automation.save();
    if (automation.action === 'notify') {
      const { notifyCreator } = await import('../services/notifications.js');
      await notifyCreator(creator, { title: automation.name, message: automation.template || `Automation triggered: ${trigger}`, type: 'automation' });
    }
    if (automation.action === 'send_email' && context.email) {
      const { sendEmail } = await import('../services/email.js');
      await sendEmail({ to: context.email, subject: automation.name, html: automation.template || `<p>Thank you for connecting with us!</p>` });
    }
  }
}
