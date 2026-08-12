import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Post } from '../models/Post.js';
import { Campaign } from '../models/Campaign.js';
import { Course } from '../models/Course.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get('/overview', async (_req, res, next) => {
  try {
    const [users, creators, products, publishedProducts, courses, publishedCourses, orders, paidOrders, posts, recentUsers, recentOrders] = await Promise.all([
      User.countDocuments(), User.countDocuments({ role: 'creator' }), Product.countDocuments(), Product.countDocuments({ status: 'published' }),
      Course.countDocuments(), Course.countDocuments({ status: 'published' }),
      Order.countDocuments(), Order.find({ status: 'paid' }), Post.countDocuments(),
      User.find().select('name email role storeName createdAt').sort({ createdAt: -1 }).limit(6),
      Order.find().populate('product', 'title').select('buyerEmail amount status product createdAt').sort({ createdAt: -1 }).limit(6)
    ]);
    const revenue = paidOrders.reduce((total, order) => total + order.amount, 0);
    res.json({ metrics: { users, creators, products, publishedProducts, courses, publishedCourses, orders, revenue, posts }, recentUsers, recentOrders });
  } catch (error) { next(error); }
});

adminRouter.get('/users', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    res.json(await User.find().select('name email role storeName storeSlug createdAt').sort({ createdAt: -1 }).limit(limit));
  } catch (error) { next(error); }
});

const roleSchema = z.object({ role: z.enum(['creator', 'admin', 'customer']) });
adminRouter.patch('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, roleSchema.parse(req.body), { new: true }).select('name email role storeName createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) { next(error); }
});

adminRouter.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.auth.sub) return res.status(400).json({ message: 'You cannot delete your own account' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});

adminRouter.get('/products', async (req, res, next) => {
  try {
    res.json(await Product.find().populate('creator', 'name email storeName').sort({ createdAt: -1 }).limit(100));
  } catch (error) { next(error); }
});

adminRouter.patch('/products/:id', async (req, res, next) => {
  try {
    const schema = z.object({ status: z.enum(['draft', 'published']).optional() });
    const product = await Product.findByIdAndUpdate(req.params.id, schema.parse(req.body), { new: true }).populate('creator', 'name email');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) { next(error); }
});

adminRouter.delete('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});

adminRouter.get('/orders', async (_req, res, next) => {
  try {
    res.json(await Order.find().populate('product', 'title').populate('course', 'title').populate('creator', 'name email').sort({ createdAt: -1 }).limit(100));
  } catch (error) { next(error); }
});

adminRouter.get('/campaigns', async (_req, res, next) => {
  try {
    res.json(await Campaign.find().populate('creator', 'name email').sort({ createdAt: -1 }).limit(100));
  } catch (error) { next(error); }
});

adminRouter.delete('/campaigns/:id', async (req, res, next) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});

adminRouter.get('/posts', async (_req, res, next) => {
  try {
    res.json(await Post.find().populate('creator', 'name email').sort({ createdAt: -1 }).limit(100));
  } catch (error) { next(error); }
});

adminRouter.delete('/posts/:id', async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});

adminRouter.get('/courses', async (_req, res, next) => {
  try {
    res.json(await Course.find().populate('creator', 'name email storeName').sort({ createdAt: -1 }).limit(100));
  } catch (error) { next(error); }
});

adminRouter.patch('/courses/:id', async (req, res, next) => {
  try {
    const schema = z.object({ status: z.enum(['draft', 'published']).optional() });
    const course = await Course.findByIdAndUpdate(req.params.id, schema.parse(req.body), { new: true }).populate('creator', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) { next(error); }
});

adminRouter.delete('/courses/:id', async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.status(204).end();
  } catch (error) { next(error); }
});
