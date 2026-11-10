import { Router } from 'express';
import {
  getAllMentors,
  getMentorById,
  getMentorAvailability,
  updateMentorAvailability,
  updateMentorProfile,
} from '../controllers/mentorController.js';
import { getMentorVerifiedReviews } from '../controllers/reviewController.js';
import { optionalAuthenticate, authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllMentors);
router.get('/:id', getMentorById);
router.get('/:id/reviews', getMentorVerifiedReviews);
router.put('/:id', optionalAuthenticate, updateMentorProfile);
router.get('/:id/availability', getMentorAvailability);
router.put('/:id/availability', authenticate, requireRole('MENTOR', 'ADMIN'), updateMentorAvailability);

export default router;
