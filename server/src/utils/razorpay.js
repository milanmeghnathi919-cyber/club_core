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

export const isRazorpayEnabled = () => true

export async function createOrder({ amount, currency = 'INR', receipt, notes }) {
  const client = getClient()
  if (!client) {
    // Dummy / Mock Razorpay order simulation
    return {
      id: `order_fake_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entity: 'order',
      amount: Math.round(amount * 100),
      amount_paid: 0,
      amount_due: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      status: 'created',
      notes: notes || {},
      created_at: Math.floor(Date.now() / 1000),
    }
  }

  // Razorpay expects the smallest currency unit (paise)
  return client.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
    notes,
  })
}

export function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  // If simulated dummy payment or Razorpay keySecret not set
  if (
    !config.razorpay.keySecret ||
    razorpay_payment_id?.startsWith('pay_fake_') ||
    razorpay_payment_id?.startsWith('pay_dummy_') ||
    razorpay_signature === 'dummy_signature'
  ) {
    return true
  }

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