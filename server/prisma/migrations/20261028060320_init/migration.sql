-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mentor_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "expertise" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "sampleAvailability" TEXT,
    "avatarInitials" TEXT NOT NULL,
    "education" TEXT,
    "experience" TEXT,
    "mentoringTopics" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mentor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mentee_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "university" TEXT DEFAULT 'ADYPU',
    "major" TEXT,
    "graduationYear" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mentee_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mentor_availabilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "slotLabel" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "specificDate" TEXT,
    "isBookable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mentor_availabilities_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "mentor_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT,
    "studentName" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "sessionDate" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "sessionTopic" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "mentor_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "mentee_profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_profiles_userId_key" ON "mentor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "mentee_profiles_userId_key" ON "mentee_profiles"("userId");

-- CreateIndex
CREATE INDEX "mentor_availabilities_mentorId_idx" ON "mentor_availabilities"("mentorId");

-- CreateIndex
CREATE INDEX "bookings_mentorId_sessionDate_idx" ON "bookings"("mentorId", "sessionDate");

-- CreateIndex
CREATE INDEX "bookings_studentEmail_idx" ON "bookings"("studentEmail");
