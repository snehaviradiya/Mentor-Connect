import { Router } from 'express';
import {
  createBooking,
  listBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
} from '../controllers/bookingController.js';
import { optionalAuthenticate, authenticate } from '../middleware/auth.js';
import { validateBookingInput } from '../middleware/validator.js';

const router = Router();

// Guest or authenticated student can request bookings
router.post('/', optionalAuthenticate, validateBookingInput, createBooking);

// Booking records are private to the student, assigned mentor, or admin.
router.get('/', authenticate, listBookings);

router.get('/:id', authenticate, getBookingById);

router.patch('/:id/cancel', authenticate, cancelBooking);
router.patch('/:id/reschedule', authenticate, rescheduleBooking);

export default router;
