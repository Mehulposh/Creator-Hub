import { CustomerNotification } from '../models/CustomerNotification.js';
import { sendEmail } from './email.js';

export async function notifyCustomer({ email, title, message, type = 'system', relatedId }) {
  const normalized = email.toLowerCase();
  await CustomerNotification.create({
    email: normalized,
    title,
    message,
    type,
    relatedId
  });
  await sendEmail({
    to: normalized,
    subject: title,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px"><h2>${title}</h2><p>${message.replace(/\n/g, '<br/>')}</p><p style="margin-top:24px;font-size:13px;color:#666">Sign in to <a href="${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173'}/customer?tab=sessions">My Library</a> to view your sessions.</p></div>`
  });
}

export async function notifySessionConfirmed(appointment, creatorName) {
  const when = new Date(appointment.startsAt).toLocaleString();
  const title = 'Your session is confirmed!';
  const message = `${creatorName} confirmed your session "${appointment.title}" scheduled for ${when}.\n\nJoin link: ${appointment.joinLink}`;
  return notifyCustomer({
    email: appointment.clientEmail,
    title,
    message,
    type: 'session',
    relatedId: appointment._id
  });
}
