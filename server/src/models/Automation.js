import { Schema, model } from 'mongoose';

const automationSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  trigger: { type: String, enum: ['new_subscriber', 'new_customer', 'new_sale', 'booking_confirmed'], default: 'new_subscriber' },
  action: { type: String, enum: ['send_email', 'add_tag', 'notify'], default: 'send_email' },
  template: { type: String, default: '' },
  active: { type: Boolean, default: true },
  runs: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

export const Automation = model('Automation', automationSchema);
