import { Schema, model } from 'mongoose';

const contactSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  status: { type: String, enum: ['lead', 'customer', 'subscriber'], default: 'lead' },
  tags: [{ type: String, trim: true }],
  notes: { type: String, default: '' }
}, { timestamps: true });
contactSchema.index({ creator: 1, email: 1 }, { unique: true });
export const Contact = model('Contact', contactSchema);
