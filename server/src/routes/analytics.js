import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';
import { Product } from '../models/Product.js';
import { Contact } from '../models/Contact.js';
import { Appointment } from '../models/Appointment.js';
import { Campaign } from '../models/Campaign.js';
import { Order } from '../models/Order.js';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth, requireCreator);

analyticsRouter.get('/overview', async (req, res, next) => {
  try {
    const creator = req.auth.sub;
    const [products, contacts, appointments, campaigns, orders] = await Promise.all([
      Product.find({ creator }),
      Contact.find({ creator }),
      Appointment.find({ creator }),
      Campaign.find({ creator }),
      Order.find({ creator, status: 'paid' }).sort({ createdAt: 1 })
    ]);
    const revenue = orders.reduce((total, order) => total + order.amount, 0);
    const sales = orders.length;
    const sentCampaigns = campaigns.filter((campaign) => campaign.status === 'sent');
    const sent = sentCampaigns.reduce((total, campaign) => total + campaign.recipientCount, 0);
    const opens = sentCampaigns.reduce((total, campaign) => total + campaign.opens, 0);
    const upcomingBookings = appointments.filter((a) => a.startsAt > new Date() && a.status !== 'cancelled').length;

    const now = new Date();
    const chart = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - 10 + i, 1);
      const monthRevenue = orders.filter((o) => o.createdAt >= monthStart && o.createdAt < monthEnd).reduce((t, o) => t + o.amount, 0);
      return monthRevenue;
    });
    const maxChart = Math.max(...chart, 1);
    const normalizedChart = chart.map((v) => Math.round((v / maxChart) * 100));

    const topProducts = products.sort((a, b) => b.sales - a.sales).slice(0, 3).map((p) => ({
      title: p.title, type: p.type.replace('_', ' '), price: p.price, sales: p.sales
    }));

    const recentActivity = [
      ...orders.slice(-3).reverse().map((o) => ({ type: 'sale', text: `${o.buyerEmail} purchased a product`, time: o.createdAt })),
      ...contacts.slice(-2).reverse().map((c) => ({ type: 'subscriber', text: `${c.name} joined as ${c.status}`, time: c.createdAt })),
      ...appointments.filter((a) => a.status === 'confirmed').slice(-2).reverse().map((a) => ({ type: 'booking', text: `${a.title} with ${a.clientName}`, time: a.createdAt }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    res.json({
      revenue, sales, productCount: products.length,
      contacts: contacts.length,
      subscribers: contacts.filter((c) => c.status === 'subscriber').length,
      upcomingBookings,
      emailOpenRate: sent ? Math.round((opens / sent) * 1000) / 10 : 0,
      chart: normalizedChart,
      topProducts,
      recentActivity,
      storeVisits: sales * 19 + products.length * 42
    });
  } catch (error) { next(error); }
});
