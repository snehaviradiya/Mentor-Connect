import { Router } from 'express';
import { getStudentDashboard, getMentorDashboard } from '../controllers/dashboardController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// Student dashboard – only STUDENT role
router.get('/student', authenticate, requireRole('STUDENT'), getStudentDashboard);

// Mentor dashboard – only MENTOR role
router.get('/mentor', authenticate, requireRole('MENTOR'), getMentorDashboard);

export default router;
