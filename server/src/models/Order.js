import { Schema, model } from 'mongoose';

const orderSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  itemType: { type: String, enum: ['product', 'course'], default: 'product' },
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  buyerName: { type: String, default: '' },
  buyerEmail: { type: String, required: true, lowercase: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'usd' },
  status: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
  paymentProvider: { type: String, enum: ['stripe', 'manual'], default: 'stripe' },
  paymentReference: String,
  cartSessionId: String,
  couponCode: String,
  downloadToken: String,
  downloadCount: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

orderSchema.index({ buyerEmail: 1, status: 1 });

export const Order = model('Order', orderSchema);
