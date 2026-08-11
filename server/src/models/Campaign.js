import { Schema, model } from 'mongoose';

const campaignSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  audience: { type: String, enum: ['all', 'leads', 'customers', 'subscribers'], default: 'all' },
  status: { type: String, enum: ['draft', 'scheduled', 'sent'], default: 'draft' },
  sentAt: Date,
  recipientCount: { type: Number, default: 0 },
  opens: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 }
}, { timestamps: true });
export const Campaign = model('Campaign', campaignSchema);
