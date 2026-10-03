export const MEMBER_COLUMNS = [
  'id',
  'member_code',
  'user_id',
  'full_name',
  'phone',
  'email',
  'dob',
  'address',
  'emergency_contact',
  'photo_url',
  'notes',
  'created_by',
  'created_at',
]

/** Client speaks camelCase, Postgres speaks snake_case. */
export const toDbMember = (data) => ({
  member_code: data.memberCode,
  user_id: data.userId ?? null,
  full_name: data.fullName,
  phone: data.phone,
  email: data.email ?? null,
  dob: data.dob ?? null,
  address: data.address ?? null,
  emergency_contact: data.emergencyContact ?? null,
  photo_url: data.photoUrl ?? null,
  notes: data.notes ?? null,
  created_by: data.createdBy ?? null,
})

export const toClientMember = (row) => {
  if (!row) return null
  return {
    id: row.id,
    memberCode: row.member_code,
    userId: row.user_id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    dob: row.dob,
    address: row.address,
    emergencyContact: row.emergency_contact,
    photoUrl: row.photo_url,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

export default { MEMBER_COLUMNS, toDbMember, toClientMember }