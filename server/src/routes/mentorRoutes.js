import { Router } from 'express';
import {
  getAllMentors,
  getMentorById,
  getMentorAvailability,
  updateMentorAvailability,
} from '../controllers/mentorController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllMentors);
router.get('/:id', getMentorById);
router.get('/:id/availability', getMentorAvailability);
router.put('/:id/availability', authenticate, updateMentorAvailability);

export default router;
