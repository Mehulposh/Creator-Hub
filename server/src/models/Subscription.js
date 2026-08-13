import { Schema, model } from 'mongoose';

const subscriptionSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  membership: { type: Schema.Types.ObjectId, ref: 'Membership', required: true },
  buyerEmail: { type: String, required: true, lowercase: true, trim: true },
  buyerName: { type: String, default: '' },
  amount: { type: Number, required: true, min: 0 },
  interval: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
  status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  paymentReference: String
}, { timestamps: true });

subscriptionSchema.index({ buyerEmail: 1, membership: 1 });

export const Subscription = model('Subscription', subscriptionSchema);
