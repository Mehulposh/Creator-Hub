import { Router } from 'express';
import { z } from 'zod';
import { Appointment } from '../models/Appointment.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';
import { notifyCreator } from '../services/notifications.js';
import { notifySessionConfirmed } from '../services/customerNotifications.js';
import { runAutomations } from './automations.js';

export const appointmentRouter = Router();

const schema = z.object({
  clientName: z.string().min(2).max(100),
  clientEmail: z.string().email(),
  title: z.string().min(2).max(120),
  startsAt: z.coerce.date(),
  duration: z.coerce.number().min(15).max(480).optional(),
  status: z.enum(['confirmed', 'pending', 'completed', 'cancelled']).optional(),
  notes: z.string().max(1000).optional(),
  joinLink: z.union([z.string().url(), z.literal('')]).optional()
});

const confirmSchema = z.object({ joinLink: z.string().url() });

appointmentRouter.use(requireAuth, requireCreator);

appointmentRouter.get('/', async (req, res, next) => {
  try {
    res.json(await Appointment.find({ creator: req.auth.sub }).sort({ startsAt: 1 }));
  } catch (error) { next(error); }
});

appointmentRouter.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await Appointment.create({ ...schema.parse(req.body), creator: req.auth.sub, source: 'manual' }));
  } catch (error) { next(error); }
});

appointmentRouter.post('/:id/confirm', async (req, res, next) => {
  try {
    const { joinLink } = confirmSchema.parse(req.body);
    const existing = await Appointment.findOne({ _id: req.params.id, creator: req.auth.sub });
    if (!existing) return res.status(404).json({ message: 'Appointment not found' });
    if (existing.status === 'cancelled') return res.status(400).json({ message: 'Cannot confirm a cancelled session.' });

    const appointment = await Appointment.findOneAndUpdate(
      { _id: existing._id },
      { status: 'confirmed', joinLink },
      { new: true }
    );

    const creator = await User.findById(req.auth.sub).select('name storeName');
    const creatorName = creator?.storeName || creator?.name || 'Your creator';
    await notifySessionConfirmed(appointment, creatorName);
    await runAutomations(req.auth.sub, 'booking_confirmed', { email: appointment.clientEmail });

    res.json(appointment);
  } catch (error) { next(error); }
});

appointmentRouter.patch('/:id', async (req, res, next) => {
  try {
    const existing = await Appointment.findOne({ _id: req.params.id, creator: req.auth.sub });
    if (!existing) return res.status(404).json({ message: 'Appointment not found' });

    const updates = schema.partial().parse(req.body);
    const appointment = await Appointment.findOneAndUpdate(
      { _id: existing._id, creator: req.auth.sub },
      updates,
      { new: true }
    );

    const becameConfirmed = updates.status === 'confirmed'
      && existing.status !== 'confirmed'
      && appointment.joinLink;

    if (becameConfirmed) {
      const creator = await User.findById(req.auth.sub).select('name storeName');
      const creatorName = creator?.storeName || creator?.name || 'Your creator';
      await notifySessionConfirmed(appointment, creatorName);
      await runAutomations(req.auth.sub, 'booking_confirmed', { email: appointment.clientEmail });
    }

    res.json(appointment);
  } catch (error) { next(error); }
});

appointmentRouter.delete('/:id', async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, creator: req.auth.sub });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});
