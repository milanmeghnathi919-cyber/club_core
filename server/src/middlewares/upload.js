import multer from 'multer'
import config from '../config/index.js'
import { uploadImage, deleteImage } from '../utils/storage/cloudinary.js'
import ApiError from '../utils/ApiError.js'

// Files stay in memory (buffer) so we can stream them straight to Cloudinary
// without ever writing to the local disk.
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  if (!config.upload.allowedMimeTypes.includes(file.mimetype)) {
    return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`))
  }
  cb(null, true)
}

const limits = { fileSize: config.upload.maxFileSizeBytes, files: 1 }

export const uploadSingleImage = (field = 'image') =>
  multer({ storage, fileFilter, limits }).single(field)

export const uploadImageArray = (field = 'images', max = 5) =>
  multer({ storage, fileFilter, limits: { ...limits, files: max } }).array(field, max)

/**
 * Requires one uploaded image. Returns { imageUrl, publicId, ... }.
 */
export const uploadOne = async (req, res, next) => {
  try {
    if (!req.file) throw ApiError.badRequest('No image file provided')

    const folder = req.body?.folder
    const uploaded = await uploadImage(req.file.buffer, {
      folder: folder || undefined,
    })

    req.image = uploaded
    res.locals.image = uploaded
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Requires one or more uploaded images. Returns [{ imageUrl, publicId, ... }, ...].
 */
export const uploadMany = async (req, res, next) => {
  try {
    const files = req.files ?? []
    if (!files.length) throw ApiError.badRequest('No image files provided')

    req.images = await Promise.all(
      files.map((file) => uploadImage(file.buffer, { folder: req.body?.folder || undefined })),
    )
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Replaces the stored image on a row: uploads the new file first, then deletes
 * the old Cloudinary asset only after the new URL is known.
 */
export const replaceStoredImage = async (existingPublicId, buffer, folder) => {
  const uploaded = await uploadImage(buffer, { folder: folder || undefined })
  if (existingPublicId && existingPublicId !== uploaded.publicId) {
    await deleteImage(existingPublicId).catch(() => null)
  }
  return uploaded
}

export { deleteImage }
export default uploadSingleImage