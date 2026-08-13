import { Schema, model } from 'mongoose';

const linkBlockSchema = new Schema({
  label: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  icon: { type: String, default: 'link' },
  order: { type: Number, default: 0 }
}, { _id: true });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['creator', 'customer', 'admin'], default: 'creator' },
  avatar: String,
  storeName: String,
  storeSlug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  bio: { type: String, default: '', maxlength: 500 },
  themeColor: { type: String, default: '#8b5cf6' },
  socialLinks: {
    instagram: String,
    twitter: String,
    youtube: String,
    tiktok: String,
    website: String
  },
  linkBlocks: { type: [linkBlockSchema], default: [] },
  seoTitle: { type: String, default: '', maxlength: 120 },
  seoDescription: { type: String, default: '', maxlength: 300 },
  customDomain: { type: String, default: '', trim: true, lowercase: true },
  fontFamily: { type: String, default: 'Inter' }
}, { timestamps: true });
export const User = model('User', userSchema);
