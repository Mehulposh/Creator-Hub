import { Schema, model } from 'mongoose';

const productSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  price: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['digital_download', 'template', 'course', 'membership', 'coaching'], default: 'digital_download' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  coverColor: { type: String, default: '#8b5cf6' },
  sales: { type: Number, default: 0, min: 0 },
  downloadUrl: { type: String, default: '' },
  downloadLimit: { type: Number, default: 5, min: 1 }
}, { timestamps: true });
export const Product = model('Product', productSchema);
