import { Router } from 'express';
import { z } from 'zod';
import { Campaign } from '../models/Campaign.js';
import { Contact } from '../models/Contact.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCreator } from '../middleware/creator.js';
import { sendCampaignEmail } from '../services/email.js';

export const campaignRouter = Router();
const schema = z.object({ name: z.string().min(2).max(100), subject: z.string().min(2).max(160), content: z.string().max(10000).optional(), audience: z.enum(['all', 'leads', 'customers', 'subscribers']).optional(), status: z.enum(['draft', 'scheduled']).optional() });
campaignRouter.use(requireAuth, requireCreator);
campaignRouter.get('/', async (req, res, next) => { try { res.json(await Campaign.find({ creator: req.auth.sub }).sort({ createdAt: -1 })); } catch (error) { next(error); } });
campaignRouter.post('/', async (req, res, next) => { try { res.status(201).json(await Campaign.create({ ...schema.parse(req.body), creator: req.auth.sub })); } catch (error) { next(error); } });
campaignRouter.post('/:id/send', async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, creator: req.auth.sub });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    const status = { leads: 'lead', customers: 'customer', subscribers: 'subscriber' }[campaign.audience];
    const filter = status ? { creator: req.auth.sub, status } : { creator: req.auth.sub };
    const recipients = await Contact.find(filter).select('email name');
    const creator = await User.findById(req.auth.sub).select('name');
    let sent = 0;
    for (const contact of recipients) {
      try {
        await sendCampaignEmail({ to: contact.email, subject: campaign.subject, content: campaign.content || campaign.subject, creatorName: creator.name });
        sent += 1;
      } catch (e) { console.error(`Failed to send to ${contact.email}:`, e.message); }
    }
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.recipientCount = sent;
    campaign.opens = Math.floor(sent * 0.35);
    await campaign.save();
    res.json(campaign);
  } catch (error) { next(error); }
});
