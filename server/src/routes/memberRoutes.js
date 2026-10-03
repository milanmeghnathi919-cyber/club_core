import { Router } from 'express'
import * as memberController from '../controllers/memberController.js'
import { authenticate, staffOnly, managerOnly } from '../middlewares/auth.js'
import { uploadSingleImage } from '../middlewares/upload.js'

const router = Router()

router.use(authenticate)

router.get('/', staffOnly, memberController.listMembers)
router.get('/:id', staffOnly, memberController.getMember)

// photo is optional: send multipart/form-data with an "image" field, or plain JSON
router.post('/', managerOnly, uploadSingleImage('image'), memberController.createMember)
router.patch('/:id', managerOnly, uploadSingleImage('image'), memberController.updateMember)
router.delete('/:id', managerOnly, memberController.deleteMember)

export default router