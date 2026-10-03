import leadRepository from '../repositories/leadRepository.js'
import memberService from './memberService.js'
import notificationService from './notificationService.js'
import { sendMail } from '../utils/mailer.js'
import ApiError from '../utils/ApiError.js'

export const leadService = {
  async createFromEnquiry({
    name,
    email = null,
    phone = null,
    source = 'website',
    interest = 'membership',
    planId = null,
    sport = null,
    preferredDate = null,
    message = null,
  }) {
    if (!email && !phone) {
      throw new ApiError(422, 'At least one of phone or email is required', null, 'VALIDATION_ERROR')
    }

    const lead = await leadRepository.insert({
      name,
      email,
      phone,
      source,
      interest,
      planId,
      sport,
      preferredDate,
      message,
      status: 'new',
    })

    // Notify all staff (owner + front_desk)
    notificationService.notify({
      roles: ['owner', 'front_desk'],
      type: 'new_lead',
      title: `New Enquiry: ${name}`,
      body: `Interest: ${interest} (${phone || email})`,
      link: `/staff/leads/${lead.id}`,
    }).catch(() => {})

    // Send email alert (never blocks response)
    sendMail({
      to: 'staff@thechampionsclub.com',
      subject: `New Lead Enquiry: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nInterest: ${interest}\nMessage: ${message}`,
    }).catch(() => {})

    return lead
  },

  async create(data, actorId) {
    if (!data.email && !data.phone) {
      throw new ApiError(422, 'At least one of phone or email is required', null, 'VALIDATION_ERROR')
    }
    return leadRepository.insert({
      ...data,
      assignedTo: actorId,
    })
  },

  async list(filters) {
    return leadRepository.list(filters)
  },

  async getFollowUps() {
    return leadRepository.getFollowUps()
  },

  async get(id) {
    const lead = await leadRepository.findById(id)
    if (!lead) throw new ApiError(404, 'Lead not found', null, 'NOT_FOUND')
    return lead
  },

  async update(id, updates) {
    await this.get(id)
    const allowed = {}
    if (updates.name !== undefined) allowed.name = updates.name
    if (updates.email !== undefined) allowed.email = updates.email
    if (updates.phone !== undefined) allowed.phone = updates.phone
    if (updates.status !== undefined) allowed.status = updates.status
    if (updates.assignedTo !== undefined) allowed.assigned_to = updates.assignedTo
    if (updates.followUpAt !== undefined) allowed.follow_up_at = updates.followUpAt
    if (updates.message !== undefined) allowed.message = updates.message

    return leadRepository.update(id, allowed)
  },

  async addActivity(id, { type, text, followUpAt }, actorId) {
    await this.get(id)
    const activity = await leadRepository.addActivity({
      leadId: id,
      type,
      text,
      followUpAt,
      createdBy: actorId,
    })

    if (followUpAt) {
      await leadRepository.update(id, { follow_up_at: followUpAt })
    }

    return activity
  },

  async addQuote(id, { planId, amount, notes, validUntil }, actorId) {
    const lead = await this.get(id)

    const quote = await leadRepository.addQuote({
      leadId: id,
      planId,
      amount,
      notes,
      validUntil,
      status: 'sent',
      sentAt: new Date().toISOString(),
      createdBy: actorId,
    })

    await leadRepository.update(id, { status: 'quoted' })

    // If lead has email, send quote email
    if (lead.email) {
      sendMail({
        to: lead.email,
        subject: `Your Membership Quote from The Champions Club`,
        text: `Hello ${lead.name},\n\nHere is your requested membership quote: ₹${amount}\n\n${notes || ''}\nValid until: ${validUntil || '30 days'}`,
      }).catch(() => {})
    }

    return quote
  },

  async convert(id, { planId, paymentMethod = 'cash', createLogin = true }, actorId) {
    const lead = await this.get(id)
    if (lead.status === 'won') {
      throw new ApiError(409, 'Lead has already been converted', null, 'ALREADY_CONVERTED')
    }

    // Atomic convert: create member + membership + payment
    const member = await memberService.create(
      {
        fullName: lead.name,
        email: lead.email,
        phone: lead.phone || '0000000000',
        planId: planId || lead.plan_id,
        paymentMethod,
        createLogin,
      },
      actorId
    )

    await leadRepository.update(id, {
      status: 'won',
      converted_member_id: member.id,
    })

    return {
      lead: await this.get(id),
      member,
    }
  },
}

export default leadService
