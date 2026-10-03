import memoryStore from '../utils/memoryStore.js'
import notificationService from '../services/notificationService.js'
import { toClubDate } from '../utils/clubTime.js'

export const followUpReminders = async () => {
  const today = toClubDate()
  const pendingLeads = memoryStore.find(
    'leads',
    (l) => !['won', 'lost'].includes(l.status) && l.follow_up_date && l.follow_up_date <= today
  )

  let remindedCount = 0
  for (const lead of pendingLeads) {
    const recipients = lead.assigned_to ? [lead.assigned_to] : []
    const roles = recipients.length === 0 ? ['owner', 'front_desk'] : []

    await notificationService.notify({
      userIds: recipients,
      roles,
      type: 'lead_follow_up',
      title: 'Lead Follow-up Due',
      body: `Follow-up due for ${lead.full_name} (${lead.phone || lead.email || 'N/A'}).`,
      link: `/staff/leads/${lead.id}`,
    })
    remindedCount++
  }

  return { remindedCount }
}

export default followUpReminders
