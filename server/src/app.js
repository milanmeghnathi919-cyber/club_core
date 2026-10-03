import express from 'express'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import routes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import { apiLimiter, corsMiddleware } from './middlewares/index.js'
import config from './config/index.js'

const app = express()

app.set('trust proxy', 1)
app.use(helmet())
app.use(corsMiddleware)
app.use(compression())
app.use(
  express.json({
    limit: '1mb',
    // Razorpay webhook signature verification runs against the raw body
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8')
    },
  }),
)
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
if (config.env !== 'test') app.use(morgan('dev'))

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } }))
app.use('/api/v1', apiLimiter, routes)
app.use('/api', apiLimiter, routes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app