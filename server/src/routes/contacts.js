import { Router } from 'express';
import { z } from 'zod';
import { Contact } from '../models/Contact.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const contactRouter = Router();
const schema = z.object({ name: z.string().min(2).max(100), email: z.string().email(), status: z.enum(['lead', 'customer', 'subscriber']).optional(), tags: z.array(z.string().max(30)).max(10).optional(), notes: z.string().max(1000).optional() });
contactRouter.use(requireAuth, requireCreator);
contactRouter.get('/', async (req, res, next) => { try { res.json(await Contact.find({ creator: req.auth.sub }).sort({ createdAt: -1 })); } catch (error) { next(error); } });
contactRouter.post('/', async (req, res, next) => { try { res.status(201).json(await Contact.create({ ...schema.parse(req.body), creator: req.auth.sub })); } catch (error) { next(error); } });
contactRouter.get('/:id/history', async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, creator: req.auth.sub });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    const { Order } = await import('../models/Order.js');
    const { Appointment } = await import('../models/Appointment.js');
    const { Subscription } = await import('../models/Subscription.js');
    const [orders, appointments, subscriptions] = await Promise.all([
      Order.find({ creator: req.auth.sub, buyerEmail: contact.email, status: 'paid' }).sort({ createdAt: -1 }).limit(20),
      Appointment.find({ creator: req.auth.sub, clientEmail: contact.email }).sort({ startsAt: -1 }).limit(10),
      Subscription.find({ creator: req.auth.sub, buyerEmail: contact.email }).sort({ createdAt: -1 }).limit(10)
    ]);
    res.json({ contact, orders, appointments, subscriptions });
  } catch (error) { next(error); }
});
contactRouter.patch('/:id', async (req, res, next) => { try { const contact = await Contact.findOneAndUpdate({ _id: req.params.id, creator: req.auth.sub }, schema.partial().parse(req.body), { new: true }); if (!contact) return res.status(404).json({ message: 'Contact not found' }); res.json(contact); } catch (error) { next(error); } });
contactRouter.delete('/:id', async (req, res, next) => { try { const contact = await Contact.findOneAndDelete({ _id: req.params.id, creator: req.auth.sub }); if (!contact) return res.status(404).json({ message: 'Contact not found' }); res.status(204).end(); } catch (error) { next(error); } });
