import notificationRepository from '../repositories/notificationRepository.js'
import userRepository from '../repositories/userRepository.js'

export const notificationService = {
  async notify({ roles = [], userIds = [], type, title, body, link }) {
    let targetUserIds = [...userIds]

    if (roles.length > 0) {
      const { items } = await userRepository.list({ limit: 500 })
      const matching = items.filter((u) => roles.includes(u.role))
      for (const m of matching) {
        if (!targetUserIds.includes(m.id)) {
          targetUserIds.push(m.id)
        }
      }
    }

    // If no specific users, broadcast
    if (targetUserIds.length === 0) {
      await notificationRepository.insert({ type, title, body, link })
      return
    }

    for (const uid of targetUserIds) {
      await notificationRepository.insert({
        userId: uid,
        type,
        title,
        body,
        link,
      })
    }
  },

  async listForUser(userId) {
    const all = await notificationRepository.listForUser(userId)
    const unread = all.filter((n) => !n.is_read).length
    return {
      notifications: all,
      unreadCount: unread,
    }
  },

  async markRead(id) {
    return notificationRepository.markAsRead(id)
  },

  async markAllRead(userId) {
    return notificationRepository.markAllAsRead(userId)
  },
}

export default notificationService
