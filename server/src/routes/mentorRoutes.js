import { Router } from 'express';
import {
  getAllMentors,
  getMentorById,
  getMentorAvailability,
  updateMentorAvailability,
  updateMentorProfile,
} from '../controllers/mentorController.js';
import { optionalAuthenticate, authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllMentors);
router.get('/:id', getMentorById);
router.put('/:id', optionalAuthenticate, updateMentorProfile);
router.get('/:id/availability', getMentorAvailability);
router.put('/:id/availability', authenticate, updateMentorAvailability);

export default router;
