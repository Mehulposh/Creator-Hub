import { Router } from 'express';
import { z } from 'zod';
import { Appointment } from '../models/Appointment.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const appointmentRouter = Router();
const schema = z.object({ clientName: z.string().min(2).max(100), clientEmail: z.string().email(), title: z.string().min(2).max(120), startsAt: z.coerce.date(), duration: z.coerce.number().min(15).max(480).optional(), status: z.enum(['confirmed', 'pending', 'completed', 'cancelled']).optional(), notes: z.string().max(1000).optional() });
appointmentRouter.use(requireAuth, requireCreator);
appointmentRouter.get('/', async (req, res, next) => { try { res.json(await Appointment.find({ creator: req.auth.sub }).sort({ startsAt: 1 })); } catch (error) { next(error); } });
appointmentRouter.post('/', async (req, res, next) => { try { res.status(201).json(await Appointment.create({ ...schema.parse(req.body), creator: req.auth.sub })); } catch (error) { next(error); } });
appointmentRouter.patch('/:id', async (req, res, next) => { try { const appointment = await Appointment.findOneAndUpdate({ _id: req.params.id, creator: req.auth.sub }, schema.partial().parse(req.body), { new: true }); if (!appointment) return res.status(404).json({ message: 'Appointment not found' }); res.json(appointment); } catch (error) { next(error); } });
appointmentRouter.delete('/:id', async (req, res, next) => { try { const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, creator: req.auth.sub }); if (!appointment) return res.status(404).json({ message: 'Appointment not found' }); res.status(204).end(); } catch (error) { next(error); } });
