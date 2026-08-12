import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[email stub] To: ${to} | Subject: ${subject}`);
    return { stub: true };
  }
  const from = process.env.EMAIL_FROM || 'noreply@creatorhub.app';
  return mailer.sendMail({ from, to, subject, html, text: text || html.replace(/<[^>]+>/g, '') });
}

export async function sendCampaignEmail({ to, subject, content, creatorName }) {
  const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><p>${content.replace(/\n/g, '<br/>')}</p><hr/><small>Sent via AI Creator Hub by ${creatorName}</small></div>`;
  return sendEmail({ to, subject, html });
}
