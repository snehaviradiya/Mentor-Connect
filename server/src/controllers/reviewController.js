import prisma from '../prisma.js';
import { getAuthorizedSession } from './sessionController.js';
import { AppError } from '../middleware/errorHandler.js';

function parseTagsSafe(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try {
    return JSON.parse(tags);
  } catch {
    return [];
  }
}

/**
 * POST /api/sessions/:id/reviews
 * Submit verified feedback for a COMPLETED mentorship session.
 * Enforces:
 * - Only assigned student can review.
 * - Session status must be COMPLETED.
 * - One review per student per session (no duplicate reviews).
 * - Rating must be integer 1 to 5.
 */
export async function submitSessionReview(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment, feedback, tags } = req.body;

    const session = await getAuthorizedSession(id, req.user);

    // 1. Verify user is the assigned student
    if (session.studentId !== req.user.id) {
      return next(
        new AppError('Only the student who attended this session can submit a review.', 403, 'FORBIDDEN')
      );
    }

    // 2. Enforce completed session lifecycle requirement
    if (session.status !== 'COMPLETED') {
      return next(
        new AppError(
          `Feedback can only be submitted for completed mentorship sessions. Current status: ${session.status}`,
          400,
          'SESSION_NOT_COMPLETED'
        )
      );
    }

    // 3. Validate rating
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return next(
        new AppError('Rating must be an integer between 1 and 5.', 400, 'VALIDATION_ERROR')
      );
    }

    // 4. Check for existing review
    const existing = await prisma.sessionReview.findUnique({
      where: {
        sessionId_reviewerId: {
          sessionId: id,
          reviewerId: req.user.id,
        },
      },
    });

    if (existing) {
      return next(
        new AppError('You have already submitted a review for this mentorship session.', 409, 'REVIEW_ALREADY_EXISTS')
      );
    }

    const reviewComment = (comment || feedback || '').trim();
    const formattedTags = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : '[]');

    const review = await prisma.sessionReview.create({
      data: {
        sessionId: id,
        reviewerId: req.user.id,
        rating: numRating,
        comment: reviewComment || null,
        tags: formattedTags,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Verified session review submitted successfully.',
      data: {
        review: {
          id: review.id,
          sessionId: review.sessionId,
          reviewerId: review.reviewerId,
          reviewerName: req.user.name,
          rating: review.rating,
          comment: review.comment,
          tags: parseTagsSafe(review.tags),
          createdAt: review.createdAt,
        },
      },
    });
  } catch (err) {
    if (err?.code === 'P2002') {
      return next(
        new AppError('You have already submitted a review for this mentorship session.', 409, 'REVIEW_ALREADY_EXISTS')
      );
    }
    next(err);
  }
}

/**
 * GET /api/sessions/:id/reviews
 * Retrieve reviews for a specific session.
 */
export async function getSessionReviews(req, res, next) {
  try {
    const { id } = req.params;
    await getAuthorizedSession(id, req.user);

    const reviews = await prisma.sessionReview.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'desc' },
    });

    const reviewerIds = reviews.map((r) => r.reviewerId);
    const users = await prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, name: true, avatar: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formatted = reviews.map((r) => {
      const user = userMap.get(r.reviewerId);
      return {
        id: r.id,
        sessionId: r.sessionId,
        reviewerId: r.reviewerId,
        reviewerName: user?.name || 'Student',
        rating: r.rating,
        comment: r.comment,
        tags: parseTagsSafe(r.tags),
        createdAt: r.createdAt,
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        reviews: formatted,
        total: formatted.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/mentors/:id/reviews
 * Public endpoint to fetch all verified completed-session reviews for a mentor.
 */
export async function getMentorVerifiedReviews(req, res, next) {
  try {
    const { id } = req.params;

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id },
    });

    if (!mentor) {
      return next(new AppError(`Mentor with ID ${id} not found`, 404, 'MENTOR_NOT_FOUND'));
    }

    // Find all sessions for this mentor that have reviews
    const reviews = await prisma.sessionReview.findMany({
      where: {
        session: {
          mentorId: id,
          status: 'COMPLETED',
        },
      },
      include: {
        session: {
          include: {
            booking: {
              select: {
                sessionTopic: true,
                sessionDate: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const reviewerIds = reviews.map((r) => r.reviewerId);
    const users = await prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, name: true, avatar: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formatted = reviews.map((r) => {
      const reviewer = userMap.get(r.reviewerId);
      return {
        id: r.id,
        sessionId: r.sessionId,
        rating: r.rating,
        studentName: reviewer?.name || 'Verified Student',
        sessionTopic: r.session.booking?.sessionTopic || 'Mentorship Session',
        sessionDate: r.session.booking?.sessionDate || '',
        feedback: r.comment,
        tags: parseTagsSafe(r.tags),
        createdAt: r.createdAt,
      };
    });

    const averageRating = formatted.length > 0
      ? Number((formatted.reduce((acc, cur) => acc + cur.rating, 0) / formatted.length).toFixed(1))
      : 5.0;

    res.status(200).json({
      status: 'success',
      data: {
        mentorId: id,
        totalReviews: formatted.length,
        averageRating,
        reviews: formatted,
      },
    });
  } catch (err) {
    next(err);
  }
}
