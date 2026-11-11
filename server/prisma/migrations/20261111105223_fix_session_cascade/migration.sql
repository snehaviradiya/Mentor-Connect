-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "meetingRoomId" TEXT NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sessions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_sessions" ("bookingId", "cancelledAt", "completedAt", "createdAt", "id", "meetingRoomId", "mentorId", "startedAt", "status", "studentId", "updatedAt") SELECT "bookingId", "cancelledAt", "completedAt", "createdAt", "id", "meetingRoomId", "mentorId", "startedAt", "status", "studentId", "updatedAt" FROM "sessions";
DROP TABLE "sessions";
ALTER TABLE "new_sessions" RENAME TO "sessions";
CREATE UNIQUE INDEX "sessions_bookingId_key" ON "sessions"("bookingId");
CREATE UNIQUE INDEX "sessions_meetingRoomId_key" ON "sessions"("meetingRoomId");
CREATE INDEX "sessions_mentorId_idx" ON "sessions"("mentorId");
CREATE INDEX "sessions_studentId_idx" ON "sessions"("studentId");
CREATE INDEX "sessions_status_idx" ON "sessions"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
