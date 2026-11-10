import { getAuthorizedSession } from './sessionController.js';
import { AppError } from '../middleware/errorHandler.js';

const JITSI_DOMAIN = process.env.JITSI_DOMAIN || 'meet.jit.si';

/**
 * GET /api/sessions/:id/meeting
 * Retrieve secure meeting room details and Jitsi configuration for a session.
 * Enforces ownership: only assigned student, assigned mentor, or admin can access.
 */
export async function getMeetingInfo(req, res, next) {
  try {
    const { id } = req.params;
    const session = await getAuthorizedSession(id, req.user);

    const isMentor = req.user.mentorProfile && session.mentorId === req.user.mentorProfile.id;
    const isStudent = session.studentId === req.user.id;
    const participantRole = req.user.role === 'ADMIN' ? 'moderator' : (isMentor ? 'moderator' : 'participant');

    // Meeting active window check
    const canJoin = session.status === 'SCHEDULED' || session.status === 'IN_PROGRESS';
    let statusNotice = null;

    if (session.status === 'COMPLETED') {
      statusNotice = 'This mentorship session has concluded. Video call access is closed.';
    } else if (session.status === 'CANCELLED') {
      statusNotice = 'This mentorship session was cancelled. Video call access is unavailable.';
    }

    const domain = process.env.JITSI_DOMAIN || 'meet.jit.si';
    const roomName = session.meetingRoomId;
    const meetingUrl = `https://${domain}/${roomName}`;

    res.status(200).json({
      status: 'success',
      data: {
        meeting: {
          sessionId: session.id,
          bookingId: session.bookingId,
          domain,
          roomName,
          meetingUrl,
          sessionStatus: session.status,
          canJoin,
          statusNotice,
          userRole: participantRole,
          participant: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar || null,
          },
          config: {
            subject: session.booking?.sessionTopic || 'Mentorship Consultation',
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: true,
          },
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
