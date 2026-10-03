import rateLimit from 'express-rate-limit'
import cors from 'cors'
import config from '../config/index.js'

export const corsOptions = {
  origin: config.clientOrigin,
  credentials: true,
}

export const corsMiddleware = cors(corsOptions)

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
})