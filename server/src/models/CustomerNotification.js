import { Schema, model } from 'mongoose';

const customerNotificationSchema = new Schema({
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['session', 'order', 'system'], default: 'system' },
  relatedId: { type: Schema.Types.ObjectId },
  read: { type: Boolean, default: false }
}, { timestamps: true });

export const CustomerNotification = model('CustomerNotification', customerNotificationSchema);
