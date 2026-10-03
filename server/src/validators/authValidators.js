import ApiError from '../utils/ApiError.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Tiny declarative body validator: collect every problem, then reject with all of them.
 */
const validate = (schema) => (req, res, next) => {
  const errors = []

  for (const [field, rule] of Object.entries(schema)) {
    const value = req.body[field]

    if (rule.required && (value === undefined || value === '' || value === null)) {
      errors.push(`${field} is required`)
      continue
    }
    if (value && rule.email && !EMAIL_RE.test(value)) {
      errors.push(`${field} must be a valid email`)
    }
    if (value && rule.minLength && String(value).length < rule.minLength) {
      errors.push(`${field} must be at least ${rule.minLength} characters`)
    }
    if (value && rule.enum && !rule.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rule.enum.join(', ')}`)
    }
  }

  if (errors.length) return next(ApiError.badRequest('Validation failed', errors))
  next()
}

export const registerRules = {
  name: { required: true, minLength: 2 },
  email: { required: true, email: true },
  password: { required: true, minLength: 8 },
}

export const loginRules = {
  email: { required: true, email: true },
  password: { required: true },
}

export const changePasswordRules = {
  currentPassword: { required: true },
  newPassword: { required: true, minLength: 8 },
}

export default validate