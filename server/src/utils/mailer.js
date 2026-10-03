import nodemailer from 'nodemailer'
import config from '../config/index.js'
import logger from './logger.js'

let transporter = null

function isConfigured() {
  return Boolean(config.smtp.host && config.smtp.user && config.smtp.pass)
}

function getTransporter() {
  if (!isConfigured()) return null

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    })
  }

  return transporter
}

export const sendMail = async ({ to, subject, text, html }) => {
  const tx = getTransporter()

  if (!tx) {
    logger.warn('SMTP not configured, skipping email to', to)
    return { skipped: true }
  }

  const info = await tx.sendMail({ from: config.smtp.from, to, subject, text, html })
  logger.info(`Email sent: ${subject} -> ${to} (${info.messageId})`)
  return info
}

export const templates = {
  membershipReminder: ({ memberName, planName, endDate, daysLeft }) => ({
    subject: `Your ${planName} membership expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    text: `Hi ${memberName},\n\nYour ${planName} membership ends on ${endDate}. Renew to keep your member rates.\n\nSee you on the court.`,
    html: `<p>Hi ${memberName},</p><p>Your <strong>${planName}</strong> membership ends on <strong>${endDate}</strong>.</p><p>Renew now to keep your member rates.</p>`,
  }),

  bookingConfirmation: ({ memberName, courtName, startAt, bookingNo }) => ({
    subject: `Booking confirmed — ${bookingNo}`,
    text: `Hi ${memberName},\n\nYour booking ${bookingNo} on ${courtName} is confirmed for ${startAt}.`,
    html: `<p>Hi ${memberName},</p><p>Booking <strong>${bookingNo}</strong> on <strong>${courtName}</strong> is confirmed for ${startAt}.</p>`,
  }),

  lowStockAlert: ({ sku, name, stockQty, threshold }) => ({
    subject: `Low stock: ${name}`,
    text: `${name} (${sku}) is at ${stockQty}. Threshold is ${threshold}.`,
    html: `<p><strong>${name}</strong> (${sku}) is down to <strong>${stockQty}</strong>. Threshold is ${threshold}.</p>`,
  }),
}

export const sendTemplatedMail = async (template, context, to) => sendMail({ to, ...template(context) })

export default sendMail