import { Schema, model } from 'mongoose';

const affiliateSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  commissionRate: { type: Number, default: 10, min: 0, max: 100 },
  referrals: { type: Number, default: 0, min: 0 },
  earnings: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'paused'], default: 'active' }
}, { timestamps: true });

affiliateSchema.index({ creator: 1, code: 1 }, { unique: true });
export const Affiliate = model('Affiliate', affiliateSchema);
