import crypto from 'node:crypto'
import config from '../config/index.js'
import ApiError from '../utils/ApiError.js'
import { query, queryOne, transaction } from '../utils/db.js'
import { isMailConfigured, sendTemplatedMail, templates } from '../utils/mailer.js'
import logger from '../utils/logger.js'

const TABLE = 'email_verification_codes'
const CODE_LENGTH = 6
const MAX_ATTEMPTS = 5

/** A 6-digit numeric code is friendlier than a long token to retype. */
const generateCode = () =>
  String(crypto.randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0')

/**
 * Codes are hashed with SHA-256 before storage.
 *
 * The code is short-lived, single-use and rate-limited, so a fast hash is the
 * right trade-off here — bcrypt would be slower without adding real protection,
 * because the input space is only 10^6 and attempt limits do the real work.
 */
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex')

/** Constant-time compare, so a wrong code cannot be found by timing. */
const safeEqual = (a, b) => {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}

export const emailVerificationService = {
  async requestCode(userId) {
    const user = await queryOne(
      'select id, email, name, is_email_verified from public.users where id = $1',
      [userId],
    )
    if (!user) throw ApiError.notFound('User not found')
    if (user.is_email_verified) throw ApiError.badRequest('Email is already verified')

    // Resend throttle: one code per user per 60 seconds
    const recent = await queryOne(
      `select created_at from public.${TABLE}
        where user_id = $1
          and created_at > now() - interval '60 seconds'`,
      [userId],
    )
    if (recent) {
      const retryAfter = Math.ceil(
        (new Date(recent.created_at).getTime() + 60_000 - Date.now()) / 1000,
      )
      throw ApiError.tooManyRequests(
        `Please wait ${retryAfter}s before requesting another code`,
        'CODE_ALREADY_SENT',
      )
    }

    const code = generateCode()
    const ttlMinutes = config.mail.codeTtlMinutes

    // Supersede any live code, then issue a fresh one.
    await transaction(async (tx) => {
      await tx.query(`update public.${TABLE} set consumed_at = now() where user_id = $1 and consumed_at is null`, [
        userId,
      ])
      await tx.query(
        `insert into public.${TABLE} (user_id, code_hash, expires_at)
         values ($1, $2, now() + ($3 || ' minutes')::interval)`,
        [userId, hashCode(code), String(ttlMinutes)],
      )
      await tx.query('update public.users set verification_sent_at = now() where id = $1', [userId])
    })

    // Never let a mail outage turn into a 500 on the request
    if (!isMailConfigured()) {
      logger.warn(`EMAIL_USER/EMAIL_PASS not set; code for ${user.email} not sent`)
      return { sent: false, reason: 'mail_not_configured', expiresInMinutes: ttlMinutes }
    }

    try {
      await sendTemplatedMail(
        templates.emailVerificationCode,
        { name: user.name, code, expiresInMinutes: ttlMinutes },
        user.email,
      )
      return { sent: true, expiresInMinutes: ttlMinutes }
    } catch (err) {
      logger.error('Verification email failed:', err.message)
      return { sent: false, reason: 'send_failed', expiresInMinutes: ttlMinutes }
    }
  },

  async verifyCode(userId, code) {
    const user = await queryOne('select id, is_email_verified from public.users where id = $1', [userId])
    if (!user) throw ApiError.notFound('User not found')
    if (user.is_email_verified) return { alreadyVerified: true }

    const outcome = await transaction(async (tx) => {
      // lock the row so two parallel guesses cannot both pass the attempts check
      const live = await tx.query(
        `select id, code_hash, expires_at, attempts
           from public.${TABLE}
          where user_id = $1 and consumed_at is null
          order by created_at desc
          limit 1
          for update`,
        [userId],
      )

      const row = live.rows[0]
      if (!row) return { error: 'No verification code is active. Request a new one.' }

      if (new Date(row.expires_at) < new Date()) {
        await tx.query(`update public.${TABLE} set consumed_at = now() where id = $1`, [row.id])
        return { error: 'That code has expired. Request a new one.' }
      }

      if (row.attempts >= MAX_ATTEMPTS) {
        await tx.query(`update public.${TABLE} set consumed_at = now() where id = $1`, [row.id])
        return { error: 'Too many incorrect attempts. Request a new code.' }
      }

      const matched = safeEqual(row.code_hash, hashCode(String(code).trim()))

      if (!matched) {
        await tx.query(`update public.${TABLE} set attempts = attempts + 1 where id = $1`, [row.id])
        // Returned rather than thrown: throwing would roll back the very
        // increment we need to keep, letting someone brute-force forever.
        return { error: 'Incorrect verification code' }
      }

      await tx.query(`update public.${TABLE} set consumed_at = now() where id = $1`, [row.id])
      await tx.query(
        'update public.users set is_email_verified = true, email_verified_at = now() where id = $1',
        [userId],
      )

      return { verified: true }
    })

    if (outcome.error) throw ApiError.badRequest(outcome.error, null, 'INVALID_CODE')

    return outcome
  },

  async status(userId) {
    const row = await queryOne(
      `select u.is_email_verified,
              u.email_verified_at,
              u.verification_sent_at,
              (select count(*)::int from public.${TABLE} c
                where c.user_id = u.id and c.consumed_at is null
                  and c.expires_at > now()) as active_codes
         from public.users u where u.id = $1`,
      [userId],
    )

    if (!row) throw ApiError.notFound('User not found')

    const secondsSinceSend = row.verification_sent_at
      ? (Date.now() - new Date(row.verification_sent_at).getTime()) / 1000
      : Infinity

    return {
      isEmailVerified: row.is_email_verified,
      verifiedAt: row.email_verified_at,
      lastSentAt: row.verification_sent_at,
      hasActiveCode: row.active_codes > 0,
      resendAvailableInSeconds: secondsSinceSend >= 60 ? 0 : Math.ceil(60 - secondsSinceSend),
    }
  },

  /** Housekeeping: drop consumed and expired codes. */
  async purgeExpired() {
    const rows = await query(
      `delete from public.${TABLE}
        where consumed_at is not null and consumed_at < now() - interval '1 day'
           or expires_at < now() - interval '1 day'
        returning id`,
    )
    return rows.length
  },
}

export default emailVerificationService