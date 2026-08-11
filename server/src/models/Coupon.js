import { Schema, model } from 'mongoose';

const couponSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  discountValue: { type: Number, required: true, min: 0 },
  maxUses: { type: Number, default: 0 },
  uses: { type: Number, default: 0, min: 0 },
  expiresAt: Date,
  active: { type: Boolean, default: true }
}, { timestamps: true });

couponSchema.index({ creator: 1, code: 1 }, { unique: true });
export const Coupon = model('Coupon', couponSchema);
