import { Schema, model } from 'mongoose';

const appointmentSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientName: { type: String, required: true, trim: true },
  clientEmail: { type: String, required: true, trim: true, lowercase: true },
  title: { type: String, required: true, trim: true },
  startsAt: { type: Date, required: true },
  duration: { type: Number, min: 15, default: 60 },
  status: { type: String, enum: ['confirmed', 'pending', 'completed', 'cancelled'], default: 'confirmed' },
  notes: { type: String, default: '' },
  joinLink: { type: String, default: '' }
}, { timestamps: true });
export const Appointment = model('Appointment', appointmentSchema);
