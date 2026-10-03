import { Router } from 'express'
import crypto from 'crypto'
import { runJob, jobs } from '../jobs/index.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ok } from '../utils/response.js'

const router = Router()

router.post(
  '/:name',
  asyncHandler(async (req, res) => {
    const secret = process.env.JOB_SECRET || 'dev_job_secret'
    const headerSecret = req.headers['x-job-secret']

    if (!headerSecret) {
      throw new ApiError(401, 'Missing x-job-secret header', null, 'UNAUTHENTICATED')
    }

    const b1 = Buffer.from(String(headerSecret))
    const b2 = Buffer.from(secret)

    if (b1.length !== b2.length || !crypto.timingSafeEqual(b1, b2)) {
      throw new ApiError(403, 'Invalid job secret', null, 'FORBIDDEN')
    }

    const { name } = req.params
    if (!jobs[name]) {
      throw new ApiError(404, `Job '${name}' not found. Available jobs: ${Object.keys(jobs).join(', ')}`, null, 'NOT_FOUND')
    }

    const result = await runJob(name)
    return ok(res, { job: name, result })
  })
)

export default router
