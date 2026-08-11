import { Schema, model } from 'mongoose';

const membershipSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, name: { type: String, required: true, trim: true }, description: { type: String, default: '' }, price: { type: Number, min: 0, required: true }, interval: { type: String, enum: ['monthly', 'annual'], default: 'monthly' }, perks: [{ type: String }], status: { type: String, enum: ['draft', 'published'], default: 'draft' }, members: { type: Number, default: 0 }
}, { timestamps: true });
export const Membership = model('Membership', membershipSchema);
