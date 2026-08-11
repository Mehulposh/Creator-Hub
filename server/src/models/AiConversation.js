import { Schema, model } from 'mongoose';

const messageSchema = new Schema({ role: { type: String, enum: ['user', 'assistant'], required: true }, content: { type: String, required: true }, sources: [{ type: String }] }, { timestamps: true, _id: false });
const conversationSchema = new Schema({ creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, kind: { type: String, enum: ['assistant', 'support', 'agent'], default: 'assistant' }, agent: String, messages: [messageSchema] }, { timestamps: true });
export const AiConversation = model('AiConversation', conversationSchema);
