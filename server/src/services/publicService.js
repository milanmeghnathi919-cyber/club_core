import settingsService from './settingsService.js'
import plansService from './plansService.js'
import courtService from './courtService.js'
import availabilityService from './availabilityService.js'
import productService from './productService.js'
import leadService from './leadService.js'
import bookingService from './bookingService.js'

export const publicService = {
  async getClubInfo() {
    const s = await settingsService.get()
    return {
      clubName: s.clubName,
      openTime: s.openTime,
      closeTime: s.closeTime,
      bookingWindowDays: s.bookingWindowDays,
      sports: ['tennis', 'cricket', 'padel', 'badminton'],
    }
  },

  async getPlans() {
    return plansService.list(false)
  },

  async getCourts() {
    return courtService.list({ includeInactive: false })
  },

  async getAvailability({ from, days, sport }) {
    return availabilityService.getFreeSlots({ from, days, sport })
  },

  async getCategories() {
    return productService.listCategories()
  },

  async getProducts({ categoryId, search, page, limit }) {
    return productService.list({
      isStaff: false,
      categoryId,
      search,
      page,
      limit,
    })
  },

  async getProduct(id) {
    return productService.get(id, false)
  },

  async createEnquiry(payload) {
    return leadService.createFromEnquiry(payload)
  },

  async createTrialBooking({ name, phone, email, courtId, startAt, notes }) {
    // 1. Create lead
    const lead = await leadService.createFromEnquiry({
      name,
      phone,
      email,
      interest: 'trial',
      message: `Trial booking requested for court ${courtId} at ${startAt}. Notes: ${notes || ''}`,
    })

    // 2. Create guest booking with source 'public_trial'
    const booking = await bookingService.create({
      courtId,
      startAt,
      guestName: name,
      guestPhone: phone,
      paymentMethod: 'pay_at_club',
      source: 'public_trial',
      notes: `Public trial booking (Lead ${lead.id})`,
    })

    return {
      lead,
      booking,
    }
  },
}

export default publicService
