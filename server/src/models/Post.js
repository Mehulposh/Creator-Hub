import { Schema, model } from 'mongoose';

const postSchema = new Schema({ creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, authorName: { type: String, required: true }, content: { type: String, required: true, maxlength: 4000 }, category: { type: String, enum: ['announcement', 'discussion', 'win'], default: 'discussion' }, likes: { type: Number, default: 0 }, comments: { type: Number, default: 0 } }, { timestamps: true });
export const Post = model('Post', postSchema);
