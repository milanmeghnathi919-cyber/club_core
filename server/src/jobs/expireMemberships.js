import memoryStore from '../utils/memoryStore.js'
import membershipRepository from '../repositories/membershipRepository.js'
import { toClubDate } from '../utils/clubTime.js'

export const expireMemberships = async () => {
  const today = toClubDate()
  const activeMemberships = memoryStore.find(
    'memberships',
    (m) => m.status === 'active' && m.end_date < today
  )

  let expiredCount = 0
  for (const m of activeMemberships) {
    await membershipRepository.update(m.id, { status: 'expired' })
    expiredCount++
  }

  return { expiredCount }
}

export default expireMemberships
