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

// List bookings (supports filtering by query or authenticated user)
router.get('/', optionalAuthenticate, listBookings);

// Individual booking details
router.get('/:id', optionalAuthenticate, getBookingById);

// Cancellation and Rescheduling
router.patch('/:id/cancel', optionalAuthenticate, cancelBooking);
router.patch('/:id/reschedule', optionalAuthenticate, rescheduleBooking);

export default router;
