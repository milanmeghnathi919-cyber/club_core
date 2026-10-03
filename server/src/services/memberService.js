import supabase from '../config/supabase.js'
import ApiError from '../utils/ApiError.js'
import memberRepository from '../repositories/memberRepository.js'
import { toDbMember, toClientMember } from '../models/Member.js'
import { uploadImage, deleteImage } from '../utils/storage/cloudinary.js'

const TABLE = 'members'
const FOLDER = 'members'

const nextMemberCode = async () => {
  const { data } = await supabase
    .from(TABLE)
    .select('member_code')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const last = Number(data?.member_code?.split('-')[1] ?? 0)
  return `M-${String(last + 1).padStart(5, '0')}`
}

/**
 * Upload the member photo to Cloudinary and return { photoUrl, publicId }.
 * `publicId` lets you delete or transform the asset later without storing a second URL.
 */
export const uploadMemberPhoto = async (file) => {
  const uploaded = await uploadImage(file.buffer, { folder: FOLDER })
  return { photoUrl: uploaded.imageUrl, publicId: uploaded.publicId }
}

const removePhoto = async (photoUrl) => {
  if (!photoUrl) return
  // publicId is the path without the file extension
  const publicId = photoUrl.split('/upload/')[1]?.replace(/\.[a-z0-9]+$/i, '')
  if (publicId) await deleteImage(publicId).catch(() => null)
}

export const memberService = {
  async list(params) {
    const { items, total } = await memberRepository.list(params)
    return {
      items: items.map(toClientMember),
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      total,
      totalPages: Math.ceil(total / (params.limit ?? 20)) || 1,
    }
  },

  async getById(id) {
    const member = await memberRepository.findById(id)
    if (!member) throw ApiError.notFound('Member not found')
    return toClientMember(member)
  },

  async create(data, { photo, createdBy } = {}) {
    let photoUrl = null

    if (photo) {
      const uploaded = await uploadMemberPhoto(photo)
      photoUrl = uploaded.photoUrl
    }

    try {
      const created = await memberRepository.create(
        toDbMember({
          ...data,
          memberCode: data.memberCode ?? (await nextMemberCode()),
          photoUrl,
          createdBy,
        }),
      )
      return toClientMember(created)
    } catch (err) {
      // don't leave an orphaned asset behind if the insert fails
      await removePhoto(photoUrl)
      throw err
    }
  },

  async updateById(id, data, { photo } = {}) {
    const existing = await memberRepository.findById(id)
    if (!existing) throw ApiError.notFound('Member not found')

    const patch = {}
    if (data.fullName !== undefined) patch.full_name = data.fullName
    if (data.phone !== undefined) patch.phone = data.phone
    if (data.email !== undefined) patch.email = data.email
    if (data.dob !== undefined) patch.dob = data.dob
    if (data.address !== undefined) patch.address = data.address
    if (data.emergencyContact !== undefined) patch.emergency_contact = data.emergencyContact
    if (data.notes !== undefined) patch.notes = data.notes

    if (photo) {
      const uploaded = await uploadMemberPhoto(photo)
      patch.photo_url = uploaded.photoUrl
      if (existing.photo_url) await removePhoto(existing.photo_url)
    }

    return toClientMember(await memberRepository.updateById(id, patch))
  },

  async remove(id) {
    const existing = await memberRepository.findById(id)
    if (!existing) throw ApiError.notFound('Member not found')
    await memberRepository.deleteById(id)
    await removePhoto(existing.photo_url)
    return null
  },
}

export default memberService