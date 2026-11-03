import { Router } from 'express';
import { getStudentDashboard, getMentorDashboard } from '../controllers/dashboardController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/student', authenticate, requireRole('STUDENT'), getStudentDashboard);
router.get('/mentor', authenticate, requireRole('MENTOR'), getMentorDashboard);

export default router;