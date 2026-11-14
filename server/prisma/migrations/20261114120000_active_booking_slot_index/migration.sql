CREATE UNIQUE INDEX "idx_bookings_active_unique"
ON "bookings" ("mentorId", "sessionDate", "timeSlot")
WHERE "status" != 'cancelled';
