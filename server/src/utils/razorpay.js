import crypto from 'node:crypto'
import Razorpay from 'razorpay'
import config from '../config/index.js'
import ApiError from './ApiError.js'

let instance = null

function getClient() {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) return null
  if (!instance) {
    instance = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    })
  }
  return instance
}

export const isRazorpayEnabled = () => getClient() !== null

export async function createOrder({ amount, currency = 'INR', receipt, notes }) {
  const client = getClient()
  if (!client) throw ApiError.badRequest('Razorpay is not configured')

  // Razorpay expects the smallest currency unit (paise)
  return client.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
    notes,
  })
}

export function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!config.razorpay.keySecret) throw ApiError.badRequest('Razorpay is not configured')

  const expected = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(razorpay_signature ?? '')

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw ApiError.badRequest('Invalid payment signature')
  }

  return true
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!config.razorpay.webhookSecret) return false

  const expected = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex')

  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(signature ?? '')

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  )
}

export default { createOrder, verifyPaymentSignature, verifyWebhookSignature, isRazorpayEnabled }