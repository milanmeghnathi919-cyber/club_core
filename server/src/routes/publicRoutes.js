import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import publicController from '../controllers/publicController.js'
import { validateBody } from '../middlewares/validate.js'
import { publicEnquirySchema } from '../validators/schemas.js'

const router = Router()

const enquiryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many enquiries, please try again after a minute',
    },
  },
})

router.get('/club', publicController.getClub)
router.get('/plans', publicController.getPlans)
router.get('/courts', publicController.getCourts)
router.get('/availability', publicController.getAvailability)
router.get('/categories', publicController.getCategories)
router.get('/products', publicController.getProducts)
router.get('/products/:id', publicController.getProduct)

router.post('/enquiries', enquiryLimiter, validateBody(publicEnquirySchema), publicController.createEnquiry)
router.post('/trial-bookings', enquiryLimiter, publicController.createTrialBooking)

export default router
