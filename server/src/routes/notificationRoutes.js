import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listUserNotifications, markNotificationRead } from '../controllers/notificationController.js';

const router = Router();
router.use(authenticate);

router.get('/', listUserNotifications);
router.patch('/:id/read', markNotificationRead);

export default router;
