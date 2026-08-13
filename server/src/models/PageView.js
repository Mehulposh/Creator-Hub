import { Schema, model } from 'mongoose';

const pageViewSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  path: { type: String, default: '/' },
  referrer: { type: String, default: '' },
  source: { type: String, enum: ['store', 'funnel', 'direct'], default: 'store' }
}, { timestamps: true });

pageViewSchema.index({ creator: 1, createdAt: -1 });

export const PageView = model('PageView', pageViewSchema);
