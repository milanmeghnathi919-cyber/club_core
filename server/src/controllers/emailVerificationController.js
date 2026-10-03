import emailVerificationService from '../services/emailVerificationService.js'
import asyncHandler from '../utils/asyncHandler.js'
import logger from '../utils/logger.js'

/**
 * POST /api/auth/email/send-code
 * Emails a fresh 6-digit code to the signed-in user.
 * Always 200 so this endpoint cannot be used to discover whether an
 * address is registered.
 */
export const sendCode = asyncHandler(async (req, res) => {
  const result = await emailVerificationService.requestCode(req.user.sub)

  res.json({
    success: true,
    data: {
      sent: result.sent,
      // honest about delivery failures instead of pretending it worked
      ...(result.sent ? {} : { reason: result.reason }),
      expiresInMinutes: result.expiresInMinutes,
    },
  })
})

/**
 * POST /api/auth/email/verify
 * B: { code } — six digits.
 */
export const verifyCode = asyncHandler(async (req, res) => {
  const result = await emailVerificationService.verifyCode(req.user.sub, req.body.code)
  res.json({ success: true, data: result })
})

/** GET /api/auth/email/status */
export const status = asyncHandler(async (req, res) => {
  const result = await emailVerificationService.status(req.user.sub)
  res.json({ success: true, data: result })
})

/** POST /api/auth/email/resend — same as sendCode, kept for a clearer client name. */
export const resendCode = asyncHandler(async (req, res) => {
  const result = await emailVerificationService.requestCode(req.user.sub)
  logger.info(`Verification code resent to user ${req.user.sub}`)
  res.json({
    success: true,
    data: {
      sent: result.sent,
      ...(result.sent ? {} : { reason: result.reason }),
      expiresInMinutes: result.expiresInMinutes,
    },
  })
})

export default { sendCode, verifyCode, status, resendCode }