import { Router } from 'express';
import {
  getAllMentors,
  getMentorById,
  getMentorAvailability,
  updateMentorAvailability,
  updateMentorProfile,
} from '../controllers/mentorController.js';
import { getMentorVerifiedReviews } from '../controllers/reviewController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateProfileUpdate } from '../middleware/validator.js';

const router = Router();

router.get('/', getAllMentors);
router.get('/:id', getMentorById);
router.get('/:id/reviews', getMentorVerifiedReviews);
router.put('/:id', authenticate, requireRole('MENTOR', 'ADMIN'), validateProfileUpdate, updateMentorProfile);
router.get('/:id/availability', getMentorAvailability);
router.put('/:id/availability', authenticate, requireRole('MENTOR', 'ADMIN'), updateMentorAvailability);

export default router;
