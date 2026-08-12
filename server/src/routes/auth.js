import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';

export const authRouter = Router();
const credentials = z.object({ name: z.string().min(2).optional(), email: z.string().email(), password: z.string().min(8) });
const tokenFor = (user) => jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

authRouter.post('/register', async (req, res, next) => {
  try {
    const input = credentials.extend({ name: z.string().min(2) }).parse(req.body);
    if (await User.exists({ email: input.email })) return res.status(409).json({ message: 'Email is already registered' });
    const user = await User.create({ name: input.name, email: input.email, role: process.env.ADMIN_EMAIL?.toLowerCase() === input.email.toLowerCase() ? 'admin' : 'creator', storeName: input.name, storeSlug: `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-5)}`, passwordHash: await bcrypt.hash(input.password, 12) });
    res.status(201).json({ token: tokenFor(user), user: { id: user.id, name: user.name, email: user.email, role: user.role, storeSlug: user.storeSlug } });
  } catch (error) { next(error); }
});
authRouter.post('/login', async (req, res, next) => {
  try {
    const input = credentials.pick({ email: true, password: true }).parse(req.body);
    const user = await User.findOne({ email: input.email });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password' });
    if (process.env.ADMIN_EMAIL?.toLowerCase() === user.email.toLowerCase() && user.role !== 'admin') { user.role = 'admin'; await user.save(); }
    if (!user.storeSlug) { user.storeName = user.storeName || user.name; user.storeSlug = `${user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${user.id.slice(-5)}`; await user.save(); }
    res.json({ token: tokenFor(user), user: { id: user.id, name: user.name, email: user.email, role: user.role, storeSlug: user.storeSlug } });
  } catch (error) { next(error); }
});
