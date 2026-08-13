import { Schema, model } from 'mongoose';

const customerLoginCodeSchema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true });

customerLoginCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CustomerLoginCode = model('CustomerLoginCode', customerLoginCodeSchema);
