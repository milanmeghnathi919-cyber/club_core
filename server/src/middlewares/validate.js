import ApiError from '../utils/ApiError.js'

/**
 * Validate request property ('body' | 'query' | 'params') with a Zod schema.
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  if (!schema) return next()

  const result = schema.safeParse(req[source])
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))

    return next(new ApiError(422, 'Validation error', details, 'VALIDATION_ERROR'))
  }

  // Assign parsed and sanitized data back
  req[source] = result.data
  next()
}

export const validateBody = (schema) => validate(schema, 'body')
export const validateQuery = (schema) => validate(schema, 'query')
export const validateParams = (schema) => validate(schema, 'params')

export default {
  validate,
  validateBody,
  validateQuery,
  validateParams,
}
