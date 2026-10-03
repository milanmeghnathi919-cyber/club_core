import User from '../models/User.js'

export const userRepository = {
  findByEmail(email) {
    return User.findOne({ email }).select('+password')
  },

  findById(id) {
    return User.findById(id)
  },

  findAll({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit
    return User.find().skip(skip).limit(limit)
  },

  create(data) {
    return User.create(data)
  },

  existsByEmail(email) {
    return User.exists({ email })
  },

  count() {
    return User.countDocuments()
  },
}

export default userRepository