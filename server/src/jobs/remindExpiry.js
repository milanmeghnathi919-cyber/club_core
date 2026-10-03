import memoryStore from '../utils/memoryStore.js'
import membershipRepository from '../repositories/membershipRepository.js'
import memberRepository from '../repositories/memberRepository.js'
import notificationService from '../services/notificationService.js'
import { sendMail } from '../utils/mailer.js'
import { toClubDate } from '../utils/clubTime.js'
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'

export const remindExpiry = async () => {
  const today = toClubDate()
  const todayDate = parseISO(today)
  const activeMemberships = memoryStore.find(
    'memberships',
    (m) => m.status === 'active' && m.end_date >= today
  )

  let reminders7d = 0
  let reminders1d = 0

  for (const m of activeMemberships) {
    const endDate = parseISO(m.end_date)
    const daysLeft = differenceInCalendarDays(endDate, todayDate)

    const member = await memberRepository.findById(m.member_id)
    if (!member) continue

    // 7-day reminder
    if (daysLeft <= 7 && daysLeft > 1 && !m.reminder_7d_sent_at) {
      if (member.user_id) {
        await notificationService.notify({
          userIds: [member.user_id],
          type: 'membership_expiry',
          title: 'Membership Expiring Soon',
          body: `Your membership expires in ${daysLeft} days. Renew now to keep your benefits!`,
          link: '/me/membership',
        })
      }
      if (member.email) {
        await sendMail({
          to: member.email,
          subject: 'Champions Club - Membership Expiry Reminder',
          text: `Dear ${member.full_name},\n\nYour Champions Club membership will expire in ${daysLeft} days on ${m.end_date}. Please renew soon to continue enjoying member benefits.\n\nBest regards,\nChampions Club Team`,
        })
      }
      await membershipRepository.update(m.id, {
        reminder_7d_sent_at: new Date().toISOString(),
      })
      reminders7d++
    }

    // 1-day reminder
    if (daysLeft <= 1 && daysLeft >= 0 && !m.reminder_1d_sent_at) {
      if (member.user_id) {
        await notificationService.notify({
          userIds: [member.user_id],
          type: 'membership_expiry',
          title: 'Membership Expiring Tomorrow',
          body: `Your membership expires tomorrow (${m.end_date}). Renew now!`,
          link: '/me/membership',
        })
      }
      if (member.email) {
        await sendMail({
          to: member.email,
          subject: 'Champions Club - Urgent: Membership Expires Tomorrow',
          text: `Dear ${member.full_name},\n\nYour Champions Club membership expires tomorrow (${m.end_date}). Renew today to avoid interruption.\n\nBest regards,\nChampions Club Team`,
        })
      }
      await membershipRepository.update(m.id, {
        reminder_1d_sent_at: new Date().toISOString(),
      })
      reminders1d++
    }
  }

  return { reminders7d, reminders1d }
}

export default remindExpiry
