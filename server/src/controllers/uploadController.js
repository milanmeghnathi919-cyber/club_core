import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { uploadOne, uploadMany, deleteImage } from '../middlewares/upload.js'

/**
 * POST /api/uploads/image   (multipart/form-data, field: image)
 * -> { success, data: { imageUrl, publicId, width, height, format, bytes } }
 */
export const uploadImage = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: req.image })
})

/**
 * POST /api/uploads/images  (multipart/form-data, field: images, max 5)
 * -> { success, data: [{ imageUrl, publicId, ... }] }
 */
export const uploadImages = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: req.images })
})

/**
 * DELETE /api/uploads/:publicId
 */
export const removeImage = asyncHandler(async (req, res) => {
  const result = await deleteImage(req.params.publicId)
  if (result?.result === 'not found') throw ApiError.notFound('Image not found')
  res.json({ success: true, data: result })
})

export { uploadOne, uploadMany }
export default uploadImage