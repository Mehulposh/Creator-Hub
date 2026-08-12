import { Router } from 'express';
import { z } from 'zod';
import { Post } from '../models/Post.js';
import { Notification } from '../models/Notification.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';

export const communityRouter = Router();
const postSchema = z.object({ content: z.string().min(2).max(4000), category: z.enum(['announcement', 'discussion', 'win']).optional() });
communityRouter.use(requireAuth, requireCreator);
communityRouter.get('/posts', async (req, res, next) => { try { res.json(await Post.find({ creator: req.auth.sub }).sort({ createdAt: -1 })); } catch (error) { next(error); } });
communityRouter.post('/posts', async (req, res, next) => { try { const post = await Post.create({ ...postSchema.parse(req.body), creator: req.auth.sub, authorName: 'You' }); await Notification.create({ creator: req.auth.sub, title: 'Community post published', message: 'Your community has a new post to discover.', type: 'community' }); res.status(201).json(post); } catch (error) { next(error); } });
communityRouter.get('/notifications', async (req, res, next) => { try { res.json(await Notification.find({ creator: req.auth.sub }).sort({ createdAt: -1 }).limit(30)); } catch (error) { next(error); } });
communityRouter.patch('/notifications/:id/read', async (req, res, next) => { try { const notification = await Notification.findOneAndUpdate({ _id: req.params.id, creator: req.auth.sub }, { read: true }, { new: true }); if (!notification) return res.status(404).json({ message: 'Notification not found' }); res.json(notification); } catch (error) { next(error); } });
