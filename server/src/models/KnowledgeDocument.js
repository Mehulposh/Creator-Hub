import { Schema, model } from 'mongoose';

const chunkSchema = new Schema({ content: { type: String, required: true }, index: { type: Number, required: true } }, { _id: false });
const knowledgeDocumentSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, title: { type: String, required: true, trim: true }, content: { type: String, required: true, maxlength: 50000 }, chunks: [chunkSchema], status: { type: String, enum: ['ready', 'processing'], default: 'ready' }
}, { timestamps: true });
export const KnowledgeDocument = model('KnowledgeDocument', knowledgeDocumentSchema);
