import { Notification } from '../models/Notification.js';

export async function notifyCreator(creator, { title, message, type = 'info' }) {
  return Notification.create({ creator, title, message, type, read: false });
}
