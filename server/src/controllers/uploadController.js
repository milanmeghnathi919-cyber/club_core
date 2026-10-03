import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { uploadOne, uploadMany, deleteImage } from '../middlewares/upload.js'
import { ok, created } from '../utils/response.js'

export const uploadImage = asyncHandler(async (req, res) => {
  const img = req.image || {}
  const url = img.url || img.imageUrl || 'https://placehold.co/400x400.png'
  return created(res, {
    ...img,
    url,
    imageUrl: url,
  })
})

export const uploadImages = asyncHandler(async (req, res) => {
  const images = (req.images || []).map((img) => ({
    ...img,
    url: img.url || img.imageUrl,
  }))
  return created(res, images)
})

export const removeImage = asyncHandler(async (req, res) => {
  const result = await deleteImage(req.params.publicId)
  if (result?.result === 'not found') throw ApiError.notFound('Image not found')
  return ok(res, result)
})

export { uploadOne, uploadMany }
export default uploadImage