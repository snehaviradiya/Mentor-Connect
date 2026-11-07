/**
 * Local demonstration fixture dataset for Milestone 3A & 3B.
 *
 * IMPORTANT:
 * These records are strictly demonstration/mock profiles for evaluating the
 * Mentor Discovery and Mentor Profile Details UI.
 * They are not real registered mentors, and availability strings are placeholders
 * that are NOT live or bookable.
 */

export const MOCK_CATEGORIES = [
  'All',
  'Software Engineering',
  'Data Science & AI',
  'UI/UX Design',
  'Cloud & DevOps',
  'Product & Strategy'
];

/**
 * Standardized illustrative demo time slots for Milestone 3C-B.
 * Slots are illustrative and not live calendar availability.
 * slot-4 is explicitly configured to demonstrate deterministic conflict handling.
 */
export const DEMO_TIME_SLOTS = [
  { id: 'slot-1', label: '10:00 AM – 11:00 AM IST', isConflictDemo: false },
  { id: 'slot-2', label: '02:00 PM – 03:00 PM IST', isConflictDemo: false },
  { id: 'slot-3', label: '04:00 PM – 05:00 PM IST', isConflictDemo: false },
  { id: 'slot-4', label: '05:30 PM – 06:30 PM IST (Simulated Conflict Slot)', isConflictDemo: true }
];

export const MOCK_MENTORS = [
  {
    id: 'mentor-1',
    name: 'Aarav Sharma',
    title: 'Senior Frontend Engineer @ Fintech Labs',
    category: 'Software Engineering',
    expertise: ['React', 'TypeScript', 'Web Performance', 'Next.js'],
    bio: 'ADYPU alumnus with 6+ years in frontend architecture and micro-frontends. Passionate about helping students crack technical interviews and build production-grade web applications.',
    sampleAvailability: 'Tuesdays & Thursdays, 4:00 PM – 6:00 PM IST',
    avatarInitials: 'AS',
    education: 'B.Tech in Computer Engineering (ADYPU Alum)',
    experience: '6+ years in industry',
    mentoringTopics: ['Frontend Architecture', 'Technical Interview Prep', 'React Best Practices', 'Portfolio Reviews'],
    rating: 4.9,
    reviewCount: 24,
    reviews: [
      {
        id: 'rev-101',
        studentName: 'Jiya Srivastava',
        avatarInitials: 'JS',
        rating: 5,
        date: 'Oct 28, 2026',
        sessionTopic: 'React 19 Server Components & State Management',
        feedback: 'Aarav was exceptionally insightful! He reviewed our Capstone frontend repo, helped debug complex re-render issues, and demonstrated how to implement clean custom hooks. Highly recommended for any frontend engineer.',
        verified: true,
        tags: ['Code Review', 'Clean Explanations', 'Deep Technical Depth'],
        helpfulCount: 14
      },
      {
        id: 'rev-102',
        studentName: 'Rohan Deshpande',
        avatarInitials: 'RD',
        rating: 5,
        date: 'Oct 15, 2026',
        sessionTopic: 'Frontend System Design & Performance Profiling',
        feedback: 'Super clear walk-through of Lighthouse optimizations, web vitals, and bundle splitting. Aarav also shared interview prep tips that helped me understand real-world engineering expectations.',
        verified: true,
        tags: ['System Design', 'Performance Tuning', 'Interview Prep'],
        helpfulCount: 9
      },
      {
        id: 'rev-103',
        studentName: 'Tanvi Kadam',
        avatarInitials: 'TK',
        rating: 4,
        date: 'Sep 30, 2026',
        sessionTopic: 'Portfolio Project Architecture & Next.js Routing',
        feedback: 'Great actionable feedback on my GitHub portfolio and Next.js routing patterns. Very encouraging and structured mentor.',
        verified: true,
        tags: ['Portfolio Review', 'Next.js'],
        helpfulCount: 5
      }
    ]
  },
  {
    id: 'mentor-2',
    name: 'Dr. Priya Kulkarni',
    title: 'Assistant Professor & AI Researcher',
    category: 'Data Science & AI',
    expertise: ['Machine Learning', 'Python', 'NLP', 'Computer Vision'],
    bio: 'Academic researcher guiding students in machine learning projects, research paper publications, and graduate school applications in computer science.',
    sampleAvailability: 'Mondays & Wednesdays, 2:00 PM – 4:00 PM IST',
    avatarInitials: 'PK',
    education: 'Ph.D. in Artificial Intelligence',
    experience: '8+ years in academia & research',
    mentoringTopics: ['ML Capstone Guidance', 'Research Paper Writing', 'Dataset Preparation', 'Grad School Advice'],
    rating: 5.0,
    reviewCount: 31,
    reviews: [
      {
        id: 'rev-201',
        studentName: 'Aditya Patil',
        avatarInitials: 'AP',
        rating: 5,
        date: 'Nov 02, 2026',
        sessionTopic: 'Capstone LLM Agent Evaluation & Fine-Tuning',
        feedback: 'Dr. Priya provided exceptional academic rigour to our research project. Her methodology for benchmark metrics and dataset validation transformed our capstone paper.',
        verified: true,
        tags: ['Research Rigor', 'NLP & LLMs', 'Clear Direction'],
        helpfulCount: 18
      },
      {
        id: 'rev-202',
        studentName: 'Simran Sheikh',
        avatarInitials: 'SS',
        rating: 5,
        date: 'Oct 19, 2026',
        sessionTopic: 'Computer Vision Model Optimization',
        feedback: 'Very patient guidance on resolving overfitting in our PyTorch training pipeline. She explained loss function adjustments with intuitive mathematical proofs.',
        verified: true,
        tags: ['PyTorch', 'Model Optimization', 'Academic Excellence'],
        helpfulCount: 11
      }
    ]
  },
  {
    id: 'mentor-3',
    name: 'Rohan Deshmukh',
    title: 'Staff Cloud Solutions Architect',
    category: 'Cloud & DevOps',
    expertise: ['AWS', 'Docker', 'Kubernetes', 'CI/CD Pipelines'],
    bio: 'Cloud evangelist helping students understand modern infrastructure, containerization, and distributed systems architecture from first principles.',
    sampleAvailability: 'Saturdays, 10:00 AM – 1:00 PM IST',
    avatarInitials: 'RD',
    education: 'M.Tech in Cloud Computing',
    experience: '9+ years in cloud infrastructure',
    mentoringTopics: ['Cloud Architecture', 'Container Orchestration', 'Microservices Design', 'Cost Optimization'],
    rating: 4.8,
    reviewCount: 19,
    reviews: [
      {
        id: 'rev-301',
        studentName: 'Varun Joshi',
        avatarInitials: 'VJ',
        rating: 5,
        date: 'Oct 22, 2026',
        sessionTopic: 'Kubernetes Cluster Deployment for Capstone',
        feedback: 'Rohan helped our team configure ingress controllers and automated GitHub Actions deployments to AWS ECS. He made complex cloud concepts feel straightforward.',
        verified: true,
        tags: ['Kubernetes', 'AWS', 'CI/CD'],
        helpfulCount: 12
      }
    ]
  },
  {
    id: 'mentor-4',
    name: 'Ananya Verma',
    title: 'Lead Product Designer @ Creative Studio',
    category: 'UI/UX Design',
    expertise: ['Figma', 'User Research', 'Design Systems', 'Accessibility'],
    bio: 'Dedicated to teaching human-centered design, portfolio building, and design-to-development handoffs. Passionate about web accessibility (a11y).',
    sampleAvailability: 'Fridays, 3:00 PM – 5:30 PM IST',
    avatarInitials: 'AV',
    education: 'B.Des in Interaction Design',
    experience: '5+ years in product design',
    mentoringTopics: ['Design Systems', 'UX Case Studies', 'Web Accessibility (a11y)', 'Design Crits'],
    rating: 4.9,
    reviewCount: 22,
    reviews: [
      {
        id: 'rev-401',
        studentName: 'Neha Rao',
        avatarInitials: 'NR',
        rating: 5,
        date: 'Oct 29, 2026',
        sessionTopic: 'Figma Auto-Layout & Design System Tokens',
        feedback: 'Ananya tore apart our mobile UI screens with constructive, professional critique. Our usability score doubled after incorporating her advice on contrast and typographic hierarchy.',
        verified: true,
        tags: ['Design Systems', 'Accessibility', 'Figma Pro'],
        helpfulCount: 15
      }
    ]
  },
  {
    id: 'mentor-5',
    name: 'Vikram Joshi',
    title: 'Principal Backend Engineer',
    category: 'Software Engineering',
    expertise: ['Node.js', 'Express', 'PostgreSQL', 'System Design'],
    bio: 'Specializing in resilient REST & GraphQL APIs, data modeling, and scaling database workloads. Eager to mentor final-year capstone teams on backend architecture.',
    sampleAvailability: 'Wednesdays, 5:00 PM – 7:00 PM IST',
    avatarInitials: 'VJ',
    education: 'B.E. in Information Technology',
    experience: '10+ years in backend engineering',
    mentoringTopics: ['REST & GraphQL Design', 'Database Indexing & Schema', 'System Design Interviews', 'API Security'],
    rating: 4.9,
    reviewCount: 27,
    reviews: [
      {
        id: 'rev-501',
        studentName: 'Devansh Shah',
        avatarInitials: 'DS',
        rating: 5,
        date: 'Nov 01, 2026',
        sessionTopic: 'PostgreSQL Concurrency & ACID Transactions',
        feedback: 'Vikram explained row-level locking and optimistic concurrency with real-world examples. It saved our booking engine from race conditions.',
        verified: true,
        tags: ['Database Architecture', 'Concurrency', 'Backend'],
        helpfulCount: 10
      }
    ]
  },
  {
    id: 'mentor-6',
    name: 'Meera Sen',
    title: 'Director of Product Management',
    category: 'Product & Strategy',
    expertise: ['Product Roadmapping', 'Agile/Scrum', 'Go-To-Market', 'User Stories'],
    bio: 'Guiding aspiring product managers and student founders in feature prioritization, user interviews, and capstone presentation storytelling.',
    sampleAvailability: 'Thursdays, 6:00 PM – 8:00 PM IST',
    avatarInitials: 'MS',
    education: 'MBA in Technology Management',
    experience: '7+ years in product leadership',
    mentoringTopics: ['Capstone Pitch Decks', 'Product Roadmapping', 'User Interview Techniques', 'Metrics & KPIs'],
    rating: 4.7,
    reviewCount: 16,
    reviews: [
      {
        id: 'rev-601',
        studentName: 'Pooja Nair',
        avatarInitials: 'PN',
        rating: 5,
        date: 'Oct 25, 2026',
        sessionTopic: 'Capstone MVP Feature Prioritization & Pitch Deck',
        feedback: 'Meera helped us eliminate unnecessary features and sharpen our value proposition for the evaluation panel. Priceless advice!',
        verified: true,
        tags: ['Product Strategy', 'Pitch Deck', 'Feature Scoping'],
        helpfulCount: 7
      }
    ]
  },
  {
    id: 'mentor-7',
    name: 'Tanmay Patil',
    title: 'Data Engineer & Analytics Specialist',
    category: 'Data Science & AI',
    expertise: ['Data Pipelines', 'SQL', 'Apache Spark', 'Python'],
    bio: 'Focuses on end-to-end data pipelines, ETL workflows, and big data fundamentals. Helps students transition from academic coursework to practical data engineering.',
    sampleAvailability: 'Tuesdays, 3:00 PM – 5:00 PM IST',
    avatarInitials: 'TP',
    education: 'B.Tech in Computer Science',
    experience: '4+ years in data engineering',
    mentoringTopics: ['ETL Pipeline Construction', 'SQL Optimization', 'Big Data Essentials', 'Data Modeling'],
    rating: 4.8,
    reviewCount: 14,
    reviews: [
      {
        id: 'rev-701',
        studentName: 'Amit Verma',
        avatarInitials: 'AV',
        rating: 5,
        date: 'Oct 18, 2026',
        sessionTopic: 'Spark Streaming & Kafka Event Integration',
        feedback: 'Tanmay walked through pipeline architecture step by step and helped us resolve bottlenecking in our Spark streaming jobs.',
        verified: true,
        tags: ['Apache Spark', 'Data Engineering', 'Helpful'],
        helpfulCount: 6
      }
    ]
  },
  {
    id: 'mentor-8',
    name: 'Kavita Nair',
    title: 'DevOps & Site Reliability Engineer',
    category: 'Cloud & DevOps',
    expertise: ['Terraform', 'Linux', 'Monitoring & Grafana', 'GitOps'],
    bio: 'Assisting students in configuring automated build workflows, monitoring infrastructure, and adopting DevOps culture in their team projects.',
    sampleAvailability: 'Sundays, 11:00 AM – 1:00 PM IST',
    avatarInitials: 'KN',
    education: 'B.E. in Computer Technology',
    experience: '5+ years in SRE / DevOps',
    mentoringTopics: ['CI/CD Automation', 'Infrastructure as Code', 'Observability & Metrics', 'Linux Administration'],
    rating: 4.9,
    reviewCount: 18,
    reviews: [
      {
        id: 'rev-801',
        studentName: 'Kunal Shinde',
        avatarInitials: 'KS',
        rating: 5,
        date: 'Oct 21, 2026',
        sessionTopic: 'Grafana Dashboards & Prometheus Alerts',
        feedback: 'Kavita is an incredible DevOps mentor. She set up Prometheus metrics alongside us and explained alerting thresholds thoroughly.',
        verified: true,
        tags: ['Observability', 'DevOps', 'Patient Guidance'],
        helpfulCount: 8
      }
    ]
  }
];
