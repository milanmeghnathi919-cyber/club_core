import nodemailer from 'nodemailer'
import config from '../config/index.js'
import logger from './logger.js'
import ApiError from './ApiError.js'

let transporter = null

/**
 * Google SMTP over app password.
 *
 * GOOGLE_APP_PASSWORD is used, not the account password — Google rejects
 * password auth for SMTP. The app password is 16 chars with spaces stripped.
 */
export function isMailConfigured() {
  return Boolean(config.mail.user && config.mail.pass)
}

function getTransporter() {
  if (!isMailConfigured()) return null

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.mail.user,
        // Google pass keys / app passwords are shown in 4-char groups; spaces are stripped automatically
        pass: config.mail.pass.replace(/\s+/g, ''),
      },
    })
  }

  return transporter
}

/** Verify credentials without sending. Used by `npm run db:check`. */
export async function verifyMail() {
  const tx = getTransporter()
  if (!tx) throw new ApiError(503, 'EMAIL_USER / EMAIL_PASS not configured in .env')
  return tx.verify()
}

export async function sendMail({ to, subject, text, html, replyTo }) {
  const tx = getTransporter()

  if (!tx) {
    logger.warn('EMAIL_USER / EMAIL_PASS not set, skipping email to', to)
    return { skipped: true }
  }

  try {
    const info = await tx.sendMail({
      from: config.mail.from,
      to,
      subject,
      text,
      html,
      ...(replyTo && { replyTo }),
    })
    logger.info(`Email sent: ${subject} -> ${to} (${info.messageId})`)
    return info
  } catch (err) {
    // A failed send must not take down the request that triggered it.
    logger.error(`Email failed: ${subject} -> ${to}: ${err.message}`)
    throw err
  }
}

export const templates = {
  emailVerificationCode: ({ name, code, expiresInMinutes }) => ({
    subject: `${code} is your Champions Club verification code`,
    text: `Hi ${name},\n\nYour verification code is ${code}. It expires in ${expiresInMinutes} minutes.\n\nIf you did not request this, ignore this email.`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto">
        <h2 style="margin:0 0 16px">Verify your email</h2>
        <p>Hi ${name},</p>
        <p>Enter this code to finish setting up your Champions Club account:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">
          ${code}
        </p>
        <p style="color:#666;font-size:14px">Expires in ${expiresInMinutes} minutes.</p>
        <p style="color:#666;font-size:14px">If you did not request this, you can ignore this email.</p>
      </div>`,
  }),

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

export const sendTemplatedMail = async (template, context, to) =>
  sendMail({ to, ...template(context) })

export default sendMail