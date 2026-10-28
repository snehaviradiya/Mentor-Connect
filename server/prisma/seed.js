import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_TIME_SLOTS = [
  '10:00 AM – 11:00 AM IST',
  '02:00 PM – 03:00 PM IST',
  '04:00 PM – 05:00 PM IST',
  '05:30 PM – 06:30 PM IST (Simulated Conflict Slot)',
];

const SEED_MENTORS = [
  {
    id: 'mentor-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@mentorconnect.adypu.edu.in',
    title: 'Senior Frontend Engineer @ Fintech Labs',
    category: 'Software Engineering',
    expertise: ['React', 'TypeScript', 'Web Performance', 'Next.js'],
    bio: 'ADYPU alumnus with 6+ years in frontend architecture and micro-frontends. Passionate about helping students crack technical interviews and build production-grade web applications.',
    sampleAvailability: 'Tuesdays & Thursdays, 4:00 PM – 6:00 PM IST',
    avatarInitials: 'AS',
    education: 'B.Tech in Computer Engineering (ADYPU Alum)',
    experience: '6+ years in industry',
    mentoringTopics: ['Frontend Architecture', 'Technical Interview Prep', 'React Best Practices', 'Portfolio Reviews']
  },
  {
    id: 'mentor-2',
    name: 'Dr. Priya Kulkarni',
    email: 'priya.kulkarni@mentorconnect.adypu.edu.in',
    title: 'Assistant Professor & AI Researcher',
    category: 'Data Science & AI',
    expertise: ['Machine Learning', 'Python', 'NLP', 'Computer Vision'],
    bio: 'Academic researcher guiding students in machine learning projects, research paper publications, and graduate school applications in computer science.',
    sampleAvailability: 'Mondays & Wednesdays, 2:00 PM – 4:00 PM IST',
    avatarInitials: 'PK',
    education: 'Ph.D. in Artificial Intelligence',
    experience: '8+ years in academia & research',
    mentoringTopics: ['ML Capstone Guidance', 'Research Paper Writing', 'Dataset Preparation', 'Grad School Advice']
  },
  {
    id: 'mentor-3',
    name: 'Rohan Deshmukh',
    email: 'rohan.deshmukh@mentorconnect.adypu.edu.in',
    title: 'Staff Cloud Solutions Architect',
    category: 'Cloud & DevOps',
    expertise: ['AWS', 'Docker', 'Kubernetes', 'CI/CD Pipelines'],
    bio: 'Cloud evangelist helping students understand modern infrastructure, containerization, and distributed systems architecture from first principles.',
    sampleAvailability: 'Saturdays, 10:00 AM – 1:00 PM IST',
    avatarInitials: 'RD',
    education: 'M.Tech in Cloud Computing',
    experience: '9+ years in cloud infrastructure',
    mentoringTopics: ['Cloud Architecture', 'Container Orchestration', 'Microservices Design', 'Cost Optimization']
  },
  {
    id: 'mentor-4',
    name: 'Ananya Verma',
    email: 'ananya.verma@mentorconnect.adypu.edu.in',
    title: 'Lead Product Designer @ Creative Studio',
    category: 'UI/UX Design',
    expertise: ['Figma', 'User Research', 'Design Systems', 'Accessibility'],
    bio: 'Dedicated to teaching human-centered design, portfolio building, and design-to-development handoffs. Passionate about web accessibility (a11y).',
    sampleAvailability: 'Fridays, 3:00 PM – 5:30 PM IST',
    avatarInitials: 'AV',
    education: 'B.Des in Interaction Design',
    experience: '5+ years in product design',
    mentoringTopics: ['Design Systems', 'UX Case Studies', 'Web Accessibility (a11y)', 'Design Crits']
  },
  {
    id: 'mentor-5',
    name: 'Vikram Joshi',
    email: 'vikram.joshi@mentorconnect.adypu.edu.in',
    title: 'Principal Backend Engineer',
    category: 'Software Engineering',
    expertise: ['Node.js', 'Express', 'PostgreSQL', 'System Design'],
    bio: 'Specializing in resilient REST & GraphQL APIs, data modeling, and scaling database workloads. Eager to mentor final-year capstone teams on backend architecture.',
    sampleAvailability: 'Wednesdays, 5:00 PM – 7:00 PM IST',
    avatarInitials: 'VJ',
    education: 'B.E. in Information Technology',
    experience: '10+ years in backend engineering',
    mentoringTopics: ['REST & GraphQL Design', 'Database Indexing & Schema', 'System Design Interviews', 'API Security']
  },
  {
    id: 'mentor-6',
    name: 'Meera Sen',
    email: 'meera.sen@mentorconnect.adypu.edu.in',
    title: 'Director of Product Management',
    category: 'Product & Strategy',
    expertise: ['Product Roadmapping', 'Agile/Scrum', 'Go-To-Market', 'User Stories'],
    bio: 'Guiding aspiring product managers and student founders in feature prioritization, user interviews, and capstone presentation storytelling.',
    sampleAvailability: 'Thursdays, 6:00 PM – 8:00 PM IST',
    avatarInitials: 'MS',
    education: 'MBA in Technology Management',
    experience: '7+ years in product leadership',
    mentoringTopics: ['Capstone Pitch Decks', 'Product Roadmapping', 'User Interview Techniques', 'Metrics & KPIs']
  },
  {
    id: 'mentor-7',
    name: 'Tanmay Patil',
    email: 'tanmay.patil@mentorconnect.adypu.edu.in',
    title: 'Data Engineer & Analytics Specialist',
    category: 'Data Science & AI',
    expertise: ['Data Pipelines', 'SQL', 'Apache Spark', 'Python'],
    bio: 'Focuses on end-to-end data pipelines, ETL workflows, and big data fundamentals. Helps students transition from academic coursework to practical data engineering.',
    sampleAvailability: 'Tuesdays, 3:00 PM – 5:00 PM IST',
    avatarInitials: 'TP',
    education: 'B.Tech in Computer Science',
    experience: '4+ years in data engineering',
    mentoringTopics: ['ETL Pipeline Construction', 'SQL Optimization', 'Big Data Essentials', 'Data Modeling']
  },
  {
    id: 'mentor-8',
    name: 'Kavita Nair',
    email: 'kavita.nair@mentorconnect.adypu.edu.in',
    title: 'DevOps & Site Reliability Engineer',
    category: 'Cloud & DevOps',
    expertise: ['Terraform', 'Linux', 'Monitoring & Grafana', 'GitOps'],
    bio: 'Assisting students in configuring automated build workflows, monitoring infrastructure, and adopting DevOps culture in their team projects.',
    sampleAvailability: 'Sundays, 11:00 AM – 1:00 PM IST',
    avatarInitials: 'KN',
    education: 'B.E. in Computer Technology',
    experience: '5+ years in SRE / DevOps',
    mentoringTopics: ['CI/CD Automation', 'Infrastructure as Code', 'Observability & Metrics', 'Linux Administration']
  }
];

export async function seedDatabase() {
  console.log('Seeding database...');

  // Clean existing records in reverse relational order
  await prisma.booking.deleteMany({});
  await prisma.mentorAvailability.deleteMany({});
  await prisma.mentorProfile.deleteMany({});
  await prisma.menteeProfile.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Admin User
  await prisma.user.create({
    data: {
      email: 'admin@adypu.edu.in',
      name: 'System Admin',
      password: defaultPasswordHash,
      role: 'ADMIN',
    },
  });

  // 2. Create Demo Student User
  const studentUser = await prisma.user.create({
    data: {
      email: 'abhay@adypu.edu.in',
      name: 'Abhay Kumar',
      password: defaultPasswordHash,
      role: 'STUDENT',
      menteeProfile: {
        create: {
          university: 'ADYPU',
          major: 'Computer Engineering',
          graduationYear: 2027,
        },
      },
    },
    include: {
      menteeProfile: true,
    },
  });

  // 3. Create Mentors with Profiles & Availability
  for (const mentorData of SEED_MENTORS) {
    const user = await prisma.user.create({
      data: {
        email: mentorData.email,
        name: mentorData.name,
        password: defaultPasswordHash,
        role: 'MENTOR',
      },
    });

    const mentorProfile = await prisma.mentorProfile.create({
      data: {
        id: mentorData.id,
        userId: user.id,
        title: mentorData.title,
        category: mentorData.category,
        expertise: JSON.stringify(mentorData.expertise),
        bio: mentorData.bio,
        sampleAvailability: mentorData.sampleAvailability,
        avatarInitials: mentorData.avatarInitials,
        education: mentorData.education,
        experience: mentorData.experience,
        mentoringTopics: JSON.stringify(mentorData.mentoringTopics),
      },
    });

    // Create availability slots
    for (const slot of DEMO_TIME_SLOTS) {
      await prisma.mentorAvailability.create({
        data: {
          mentorId: mentorProfile.id,
          slotLabel: slot,
          isBookable: true,
        },
      });
    }
  }

  // 4. Create an illustrative existing booking for mentor-1 on slot-4 to model conflict behavior
  const existingBooking = await prisma.booking.create({
    data: {
      id: 'bk_seed_demo_01',
      mentorId: 'mentor-1',
      menteeId: studentUser.menteeProfile.id,
      studentName: 'Sneha Viradiya',
      studentEmail: 'snehaviradiya@adypu.edu.in',
      sessionDate: '2026-11-01',
      timeSlot: '05:30 PM – 06:30 PM IST (Simulated Conflict Slot)',
      sessionTopic: 'Backend Architecture & Database Seeding Review',
      notes: 'Initial milestone 3 conflict simulation record',
      status: 'confirmed',
    },
  });

  console.log(`Database seeded successfully!`);
  console.log(`Created 1 Admin, 1 Student (${studentUser.email}), ${SEED_MENTORS.length} Mentors, and 1 conflict demo booking (${existingBooking.id}).`);
}

// Execute if run directly
seedDatabase()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
