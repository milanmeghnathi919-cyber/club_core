import { Router } from 'express'
import * as memberController from '../controllers/memberController.js'
import { authenticate, authorize } from '../middlewares/auth.js'
import { uploadSingleImage } from '../middlewares/upload.js'

const router = Router()

router.use(authenticate)

router.get('/', memberController.listMembers)
router.get('/:id', memberController.getMember)

// photo is optional: send multipart/form-data with an "image" field, or plain JSON
router.post('/', uploadSingleImage('image'), memberController.createMember)
router.patch('/:id', uploadSingleImage('image'), memberController.updateMember)
router.delete('/:id', authorize('admin', 'manager'), memberController.deleteMember)

export default router