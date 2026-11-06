import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function ensureDbConstraints(client = prisma) {
  try {
    await client.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_active_unique
      ON bookings (mentorId, sessionDate, timeSlot)
      WHERE status != 'cancelled';
    `);
  } catch {
    // Graceful fallback
  }
}

// Automatically ensure constraints on client initialization
ensureDbConstraints().catch(() => {});

export default prisma;
