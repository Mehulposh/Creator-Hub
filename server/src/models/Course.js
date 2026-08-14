import { Schema, model } from 'mongoose';

const lessonSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, default: '', maxlength: 20000 },
  duration: { type: Number, default: 10 },
  isPreview: { type: Boolean, default: false },
  chapter: { type: String, default: '' },
  dripDays: { type: Number, default: 0, min: 0 },
  pdfUrl: { type: String, default: '' },
  pdfFilename: { type: String, default: '' },
  meetLink: { type: String, default: '' }
}, { _id: true });
const courseSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true }, description: { type: String, default: '' }, price: { type: Number, min: 0, default: 0 }, status: { type: String, enum: ['draft', 'published'], default: 'draft' }, lessons: [lessonSchema], enrolled: { type: Number, default: 0 }
}, { timestamps: true });
export const Course = model('Course', courseSchema);
