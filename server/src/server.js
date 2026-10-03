import mongoose from 'mongoose'
import app from './app.js'
import config, { assertConfig } from './config/index.js'
import logger from './utils/logger.js'

async function start() {
  try {
    assertConfig()

    mongoose.connection.on('error', (err) => logger.error('Mongo error:', err.message))
    await mongoose.connect(config.mongoUri)
    logger.info('MongoDB connected')

    const server = app.listen(config.port, () => {
      logger.info(`API listening on http://localhost:${config.port} (${config.env})`)
    })

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down`)
      server.close(async () => {
        await mongoose.connection.close()
        process.exit(0)
      })
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  } catch (err) {
    logger.error('Failed to start server:', err.message)
    process.exit(1)
  }
}

start()