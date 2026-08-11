import { Schema, model } from 'mongoose';

const notificationSchema = new Schema({ creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, title: { type: String, required: true }, message: { type: String, required: true }, type: { type: String, enum: ['sale', 'community', 'course', 'system'], default: 'system' }, read: { type: Boolean, default: false } }, { timestamps: true });
export const Notification = model('Notification', notificationSchema);
