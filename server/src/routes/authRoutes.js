import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRegistrationInput, validateLoginInput } from '../middleware/validator.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authLimiter, validateRegistrationInput, register);
router.post('/login', authLimiter, validateLoginInput, login);
router.get('/me', authenticate, getMe);

export default router;
