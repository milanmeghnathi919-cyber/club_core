import cron from 'node-cron'
import expireMemberships from './expireMemberships.js'
import remindExpiry from './remindExpiry.js'
import followUpReminders from './followUpReminders.js'
import releaseUnpaidOrders from './releaseUnpaidOrders.js'
import { CLUB_TZ } from '../utils/clubTime.js'

export const jobs = {
  expireMemberships,
  remindExpiry,
  followUpReminders,
  releaseUnpaidOrders,
}

export const runJob = async (jobName) => {
  const jobFn = jobs[jobName]
  if (!jobFn) {
    throw new Error(`Job '${jobName}' not found`)
  }
  return jobFn()
}

export const initJobs = () => {
  // Midnight IST: expire memberships
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[CRON] Running expireMemberships...')
      const res = await expireMemberships()
      console.log('[CRON] expireMemberships result:', res)
    } catch (err) {
      console.error('[CRON] Error running expireMemberships:', err)
    }
  }, { timezone: CLUB_TZ })

  // 09:00 IST: remind expiry (7d, 1d)
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('[CRON] Running remindExpiry...')
      const res = await remindExpiry()
      console.log('[CRON] remindExpiry result:', res)
    } catch (err) {
      console.error('[CRON] Error running remindExpiry:', err)
    }
  }, { timezone: CLUB_TZ })

  // 09:30 IST: lead follow-up reminders
  cron.schedule('30 9 * * *', async () => {
    try {
      console.log('[CRON] Running followUpReminders...')
      const res = await followUpReminders()
      console.log('[CRON] followUpReminders result:', res)
    } catch (err) {
      console.error('[CRON] Error running followUpReminders:', err)
    }
  }, { timezone: CLUB_TZ })

  // Every 5 minutes: release expired online unpaid orders
  cron.schedule('*/5 * * * *', async () => {
    try {
      const res = await releaseUnpaidOrders()
      if (res.releasedCount > 0) {
        console.log('[CRON] releaseUnpaidOrders released:', res.releasedCount)
      }
    } catch (err) {
      console.error('[CRON] Error running releaseUnpaidOrders:', err)
    }
  }, { timezone: CLUB_TZ })

  console.log(`[CRON] Scheduled background jobs initialized in timezone ${CLUB_TZ}`)
}

export default {
  jobs,
  runJob,
  initJobs,
}
