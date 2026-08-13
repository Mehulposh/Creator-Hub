import { Schema, model } from 'mongoose';

const bundleSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 2000 },
  price: { type: Number, required: true, min: 0 },
  productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  courseIds: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  coverColor: { type: String, default: '#8b5cf6' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  sales: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

export const Bundle = model('Bundle', bundleSchema);
