import { Schema, model } from 'mongoose';

const stepSchema = new Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['landing', 'lead_capture', 'checkout', 'upsell', 'thank_you'], default: 'landing' },
  content: { type: String, default: '' },
  conversionRate: { type: Number, default: 0, min: 0 }
}, { _id: true });

const funnelSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  steps: { type: [stepSchema], default: [] },
  visits: { type: Number, default: 0, min: 0 },
  conversions: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

export const Funnel = model('Funnel', funnelSchema);
