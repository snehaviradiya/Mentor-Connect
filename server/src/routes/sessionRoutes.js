import { Router } from 'express';
import {
  createSession,
  listSessions,
  getSessionById,
  startSession,
  completeSession,
  cancelSession,
} from '../controllers/sessionController.js';
import { getMeetingInfo } from '../controllers/meetingController.js';
import { getSessionMessages, createSessionMessage } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All session endpoints require authentication
router.use(authenticate);

router.post('/', createSession);
router.get('/', listSessions);
router.get('/:id', getSessionById);
router.get('/:id/meeting', getMeetingInfo);
router.get('/:id/messages', getSessionMessages);
router.post('/:id/messages', createSessionMessage);
router.patch('/:id/start', startSession);
router.patch('/:id/complete', completeSession);
router.patch('/:id/cancel', cancelSession);

export default router;
