import app from './app.js'
import config, { assertConfig } from './config/index.js'
import logger from './utils/logger.js'
import { isRazorpayEnabled } from './utils/razorpay.js'
import { initJobs } from './jobs/index.js'

import runSeeds from './db/seeds/seed.js'

async function start() {
  try {
    assertConfig()

    await runSeeds()

    if (config.env !== 'test') {
      initJobs()
    }

    const server = app.listen(config.port, () => {
      logger.info(`API listening on http://localhost:${config.port} (${config.env})`)
      logger.info(`Razorpay ${isRazorpayEnabled() ? 'enabled' : 'disabled'}`)
    })

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down`)
      server.close(() => process.exit(0))
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason)
    })
  } catch (err) {
    logger.error('Failed to start server:', err.message)
    process.exit(1)
  }
}

start()