import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { generateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Register a new user (Student or Mentor).
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, role, title, category, bio, expertise } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(new AppError('An account with this email address already exists.', 409, 'DUPLICATE_EMAIL'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and associated profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
      });

      if (role === 'MENTOR') {
        const initials = name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        await tx.mentorProfile.create({
          data: {
            id: `mentor-${user.id.slice(0, 8)}`,
            userId: user.id,
            title: title || 'Mentor & Industry Expert',
            category: category || 'Software Engineering',
            bio: bio || 'Experienced mentor eager to guide students.',
            expertise: JSON.stringify(Array.isArray(expertise) ? expertise : ['Mentorship']),
            avatarInitials: initials || 'ME',
            sampleAvailability: 'Configured on request',
          },
        });
      } else if (role === 'STUDENT') {
        await tx.menteeProfile.create({
          data: {
            userId: user.id,
            university: 'ADYPU',
          },
        });
      }

      return user;
    });

    const userWithProfiles = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        mentorProfile: true,
        menteeProfile: true,
      },
    });

    const token = generateToken(userWithProfiles);

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: {
          id: userWithProfiles.id,
          name: userWithProfiles.name,
          email: userWithProfiles.email,
          role: userWithProfiles.role,
          mentorProfile: userWithProfiles.mentorProfile,
          menteeProfile: userWithProfiles.menteeProfile,
          createdAt: userWithProfiles.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Authenticate existing user with email and password.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        mentorProfile: true,
        menteeProfile: true,
      },
    });

    if (!user) {
      return next(new AppError('Invalid email or password credentials.', 401, 'INVALID_CREDENTIALS'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password credentials.', 401, 'INVALID_CREDENTIALS'));
    }

    const token = generateToken(user);

    res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mentorProfile: user.mentorProfile,
          menteeProfile: user.menteeProfile,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve authenticated user profile.
 */
export async function getMe(req, res, next) {
  try {
    const user = req.user;
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mentorProfile: user.mentorProfile,
          menteeProfile: user.menteeProfile,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
