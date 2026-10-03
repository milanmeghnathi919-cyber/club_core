import cloudinary from '../../config/cloudinary.js'
import config from '../../config/index.js'

const uploadStream = (buffer, { folder, publicId } = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder ?? config.cloudinary.folder,
        resource_type: 'image',
        // overwrite on re-upload of the same publicId so retries are idempotent
        ...(publicId ? { public_id: publicId, overwrite: true } : {}),
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    )

    stream.end(buffer)
  })

/**
 * Uploads a buffer and normalises the result to { imageUrl, publicId, ... }.
 */
export async function uploadImage(buffer, options = {}) {
  const result = await uploadStream(buffer, options)

  return {
    imageUrl: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  }
}

export async function deleteImage(publicId) {
  if (!publicId) return null
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
}

export default uploadImage