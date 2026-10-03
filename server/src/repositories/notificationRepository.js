import { query, queryOne } from '../utils/db.js'
import memoryStore from '../utils/memoryStore.js'

export const notificationRepository = {
  async insert(data) {
    return memoryStore.insert('notifications', {
      id: data.id || crypto.randomUUID(),
      user_id: data.userId || data.user_id || null,
      type: data.type || 'info',
      title: data.title,
      body: data.body || null,
      link: data.link || null,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  },

  async listForUser(userId) {
    const items = memoryStore.find('notifications', (n) => !n.user_id || n.user_id === userId)
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return items
  },

  async markAsRead(id) {
    return memoryStore.update('notifications', (n) => n.id === id, { is_read: true })
  },

  async markAllAsRead(userId) {
    const list = memoryStore.get('notifications')
    for (let i = 0; i < list.length; i++) {
      if (!list[i].user_id || list[i].user_id === userId) {
        list[i].is_read = true
      }
    }
    return { success: true }
  },
}

export default notificationRepository
