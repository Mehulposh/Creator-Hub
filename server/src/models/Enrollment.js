import { Schema, model } from 'mongoose';

const enrollmentSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  buyerEmail: { type: String, required: true, lowercase: true, trim: true },
  completedLessons: [{ type: String }],
  progress: { type: Number, default: 0, min: 0, max: 100 },
  enrolledAt: { type: Date, default: Date.now },
  lastAccessedAt: { type: Date, default: Date.now },
  certificateIssued: { type: Boolean, default: false }
}, { timestamps: true });

enrollmentSchema.index({ buyerEmail: 1, course: 1 }, { unique: true });

export const Enrollment = model('Enrollment', enrollmentSchema);
