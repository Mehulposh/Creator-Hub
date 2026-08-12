import { Router } from 'express';
import Stripe from 'stripe';
import crypto from 'crypto';
import { z } from 'zod';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Course } from '../models/Course.js';
import { Contact } from '../models/Contact.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';
import { applyCoupon } from './coupons.js';
import { trackAffiliateReferral } from './affiliates.js';
import { notifyCreator } from '../services/notifications.js';
import { runAutomations } from './automations.js';
import { paymentMode, simulatePayment, useSimulatedPayments } from '../services/payments.js';

export const commerceRouter = Router();

const checkoutSchema = z.object({
  productId: z.string().min(1),
  email: z.string().email(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  couponCode: z.string().optional(),
  affiliateCode: z.string().optional()
});

const cartItemSchema = z.object({
  type: z.enum(['product', 'course']),
  id: z.string().min(1)
});

const cartCheckoutSchema = z.object({
  email: z.string().email(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  couponCode: z.string().optional(),
  affiliateCode: z.string().optional(),
  items: z.array(cartItemSchema).min(1).max(20)
});

async function resolveCartItem(item) {
  if (item.type === 'product') {
    const product = await Product.findOne({ _id: item.id, status: 'published' });
    if (!product) throw new Error('A product in your cart is no longer available');
    return { type: 'product', doc: product, title: product.title, description: product.description, price: product.price, creator: product.creator };
  }
  const course = await Course.findOne({ _id: item.id, status: 'published' });
  if (!course) throw new Error('A course in your cart is no longer available');
  return { type: 'course', doc: course, title: course.title, description: course.description, price: course.price, creator: course.creator };
}

commerceRouter.get('/payment-mode', (_req, res) => {
  res.json({ mode: paymentMode(), simulated: useSimulatedPayments() });
});

commerceRouter.get('/orders', requireAuth, requireCreator, async (req, res, next) => {
  try {
    res.json(await Order.find({ creator: req.auth.sub }).populate('product', 'title').populate('course', 'title').sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});

commerceRouter.post('/checkout', async (req, res, next) => {
  try {
    const input = checkoutSchema.parse(req.body);
    const resolved = await resolveCartItem({ type: 'product', id: input.productId });
    const result = await createCheckoutSession({
      email: input.email,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      couponCode: input.couponCode,
      affiliateCode: input.affiliateCode,
      items: [resolved]
    });
    res.json(result);
  } catch (error) {
    if (error.message?.includes('cart') || error.message?.includes('product') || error.message?.includes('course')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

commerceRouter.post('/cart-checkout', async (req, res, next) => {
  try {
    const input = cartCheckoutSchema.parse(req.body);
    const resolved = await Promise.all(input.items.map(resolveCartItem));
    const creators = [...new Set(resolved.map((i) => i.creator.toString()))];
    if (creators.length > 1) return res.status(400).json({ message: 'All cart items must be from the same creator' });

    const result = await createCheckoutSession({
      email: input.email,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      couponCode: input.couponCode,
      affiliateCode: input.affiliateCode,
      items: resolved
    });
    res.json(result);
  } catch (error) {
    if (error.message?.includes('cart') || error.message?.includes('product') || error.message?.includes('course')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

async function createCheckoutSession({ email, successUrl, cancelUrl, couponCode, affiliateCode, items }) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  let total = subtotal;
  let appliedCoupon;
  try {
    const couponResult = await applyCoupon(items[0].creator, couponCode, subtotal);
    total = couponResult.amount;
    appliedCoupon = couponResult.coupon?.code;
  } catch (e) {
    throw new Error(e.message);
  }

  const cartSessionId = crypto.randomBytes(12).toString('hex');
  const orders = [];
  for (const [index, item] of items.entries()) {
    const share = subtotal ? (item.price / subtotal) * total : 0;
    const order = await Order.create({
      creator: item.creator,
      itemType: item.type,
      product: item.type === 'product' ? item.doc._id : undefined,
      course: item.type === 'course' ? item.doc._id : undefined,
      buyerEmail: email,
      amount: Math.round(share * 100) / 100,
      couponCode: index === 0 ? appliedCoupon : undefined,
      cartSessionId,
      downloadToken: crypto.randomBytes(24).toString('hex'),
      status: 'pending'
    });
    orders.push({ order, item });
  }

  const downloadTokens = orders
    .filter(({ item }) => item.type === 'product')
    .map(({ order }) => ({ orderId: order.id, token: order.downloadToken }));

  const baseResponse = {
    cartSessionId,
    orderIds: orders.map(({ order }) => order.id),
    downloadTokens,
    total
  };

  if (total === 0 || useSimulatedPayments()) {
    await simulatePayment({
      orders,
      items,
      affiliateCode,
      fulfillOrder: (order, item, code) => fulfillOrder(order, item, code)
    });
    return { ...baseResponse, simulated: true, free: total === 0, message: 'Checkout completed (simulated — no real payment)' };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const line_items = orders.map(({ order, item }) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: item.title, description: item.description || undefined },
      unit_amount: Math.round(order.amount * 100)
    },
    quantity: 1
  }));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items,
    metadata: {
      cartSessionId,
      orderIds: orders.map(({ order }) => order.id).join(','),
      affiliateCode: affiliateCode || ''
    },
    success_url: `${successUrl}${successUrl.includes('?') ? '&' : '?'}cart=${cartSessionId}`,
    cancel_url: cancelUrl
  });

  await Order.updateMany({ cartSessionId }, { paymentReference: session.id });
  return { ...baseResponse, checkoutUrl: session.url };
}

const purchasesSchema = z.object({ email: z.string().email() });

commerceRouter.post('/purchases', async (req, res, next) => {
  try {
    const { email } = purchasesSchema.parse(req.body);
    const orders = await Order.find({ buyerEmail: email.toLowerCase(), status: 'paid' })
      .populate('product', 'title description downloadUrl downloadLimit type coverColor')
      .populate('course', 'title description lessons price')
      .populate('creator', 'name storeName storeSlug')
      .sort({ createdAt: -1 });

    res.json(orders.map((order) => {
      const isProduct = order.itemType === 'product';
      const item = isProduct ? order.product : order.course;
      return {
        _id: order._id,
        itemType: order.itemType,
        title: item?.title || 'Purchase',
        description: item?.description || '',
        amount: order.amount,
        createdAt: order.createdAt,
        creatorName: order.creator?.storeName || order.creator?.name || 'Creator',
        storeSlug: order.creator?.storeSlug,
        downloadToken: order.downloadToken,
        hasDownload: isProduct && Boolean(order.product?.downloadUrl),
        downloadLimit: order.product?.downloadLimit || 5,
        downloadCount: order.downloadCount,
        downloadRemaining: isProduct ? Math.max(0, (order.product?.downloadLimit || 5) - order.downloadCount) : 0,
        lessons: order.course?.lessons || [],
        coverColor: order.product?.coverColor
      };
    }));
  } catch (error) { next(error); }
});

commerceRouter.get('/download/:orderId/:token', async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, downloadToken: req.params.token, status: 'paid' }).populate('product');
    if (!order) return res.status(404).json({ available: false, message: 'Download not available. Check your email or visit My Purchases.' });
    const product = order.product;
    if (!product?.downloadUrl) {
      return res.json({
        available: false,
        message: 'The creator has not added a download file for this product yet. Visit My Purchases later or contact the seller.',
        title: product?.title || 'Product'
      });
    }
    if (order.downloadCount >= (product.downloadLimit || 5)) {
      return res.status(403).json({ available: false, message: 'Download limit reached for this product.' });
    }
    order.downloadCount += 1;
    await order.save();
    res.json({
      available: true,
      downloadUrl: product.downloadUrl,
      title: product.title,
      remaining: (product.downloadLimit || 5) - order.downloadCount
    });
  } catch (error) { next(error); }
});

export async function fulfillOrder(order, itemOrProduct, affiliateCode = '') {
  if (order.status === 'paid') return;
  order.status = 'paid';
  order.paymentProvider = order.paymentProvider || (useSimulatedPayments() ? 'manual' : 'stripe');
  await order.save();

  const item = itemOrProduct?.type ? itemOrProduct : { type: 'product', doc: itemOrProduct, title: itemOrProduct?.title || 'Product', price: order.amount };

  if (item.type === 'product') {
    const product = item.doc || await Product.findById(order.product);
    if (product) { product.sales += 1; await product.save(); }
  } else {
    const course = item.doc || await Course.findById(order.course);
    if (course) { course.enrolled += 1; await course.save(); }
  }

  if (order.couponCode) {
    const { Coupon } = await import('../models/Coupon.js');
    await Coupon.updateOne({ creator: order.creator, code: order.couponCode }, { $inc: { uses: 1 } });
  }

  if (affiliateCode) await trackAffiliateReferral(order.creator, affiliateCode, order.amount);

  await Contact.findOneAndUpdate(
    { creator: order.creator, email: order.buyerEmail },
    { $set: { status: 'customer' }, $setOnInsert: { name: order.buyerEmail.split('@')[0], creator: order.creator } },
    { upsert: true }
  );
  await notifyCreator(order.creator, {
    title: 'New sale!',
    message: `${order.buyerEmail} purchased ${item.title} for $${order.amount.toFixed(2)}`,
    type: 'sale'
  });
  await runAutomations(order.creator, 'new_sale', { email: order.buyerEmail });
}

export async function handleStripeWebhook(rawBody, signature) {
  if (useSimulatedPayments()) return null;
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return null;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderIds = session.metadata?.orderIds?.split(',').filter(Boolean) || [];
    const affiliateCode = session.metadata?.affiliateCode || '';

    if (orderIds.length) {
      for (const orderId of orderIds) {
        const order = await Order.findById(orderId).populate('product').populate('course');
        if (order && order.status === 'pending') {
          const item = order.itemType === 'course'
            ? { type: 'course', doc: order.course, title: order.course?.title || 'Course', price: order.amount }
            : { type: 'product', doc: order.product, title: order.product?.title || 'Product', price: order.amount };
          await fulfillOrder(order, item, affiliateCode);
        }
      }
    } else if (session.metadata?.orderId) {
      const order = await Order.findById(session.metadata.orderId).populate('product');
      if (order && order.status === 'pending') {
        await fulfillOrder(order, { type: 'product', doc: order.product, title: order.product?.title, price: order.amount }, affiliateCode);
      }
    }
  }
  return event;
}
