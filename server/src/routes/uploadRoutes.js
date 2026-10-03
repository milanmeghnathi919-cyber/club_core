import { Router } from 'express'
import * as uploadController from '../controllers/uploadController.js'
import { uploadSingleImage, uploadImageArray, uploadOne, uploadMany } from '../middlewares/upload.js'
import { authenticate } from '../middlewares/auth.js'

const router = Router()

router.use(authenticate)

router.post('/image', uploadSingleImage('image'), uploadOne, uploadController.uploadImage)
router.post('/images', uploadImageArray('images', 5), uploadMany, uploadController.uploadImages)
router.delete('/:publicId', uploadController.removeImage)

export default router