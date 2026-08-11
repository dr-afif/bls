import type {
  DemoAdminSnapshot,
  DemoCohort,
  DemoPerson,
  DemoProfile,
  DemoQuiz,
  DemoResource,
  InstructorSnapshot,
  LearnerSnapshot,
} from "./types";

const currentCohort: DemoCohort = {
  id: "cohort-bls-2608",
  code: "BLS-2608",
  courseName: "Adult Basic Life Support",
  date: "Saturday, 8 August 2026",
  time: "08:30–16:30",
  venue: "Clinical Skills Centre, Room 3",
  instructor: "Dr Sara Lim",
  contact: "BLS Course Office · +60 3-5550 0192",
  preparationNotes:
    "Wear comfortable clinical attire and arrive 15 minutes before registration.",
  status: "upcoming",
  learnerCount: 24,
  preTestCompleted: 18,
  postTestReleased: false,
};

const completedCohort: DemoCohort = {
  ...currentCohort,
  id: "cohort-bls-2521",
  code: "BLS-2521",
  date: "Saturday, 15 November 2025",
  instructor: "Dr Nadia Tan",
  status: "completed",
  learnerCount: 20,
  preTestCompleted: 20,
  postTestReleased: true,
};

const secondUpcomingCohort: DemoCohort = {
  ...currentCohort,
  id: "cohort-bls-2610",
  code: "BLS-2610",
  date: "Tuesday, 11 August 2026",
  time: "09:00–17:00",
  venue: "Simulation Suite, Room 1",
  instructor: "Instructor not assigned",
  status: "needs-attention",
  learnerCount: 18,
  preTestCompleted: 6,
};

export const demoResources: DemoResource[] = [
  {
    id: "adult-cpr-quick-guide",
    title: "Adult CPR quick guide",
    summary: "A concise sequence for recognition, calling for help and CPR.",
    type: "guide",
    topic: "Adult CPR",
    teachingStage: "Skills practice",
    audience: ["learner", "instructor"],
    duration: "4 min read",
    updatedAt: "Updated July 2026",
    featured: true,
  },
  {
    id: "aed-safety-checklist",
    title: "AED safety checklist",
    summary: "Pre-shock safety checks and clear communication prompts.",
    type: "checklist",
    topic: "AED",
    teachingStage: "Skills practice",
    audience: ["learner", "instructor"],
    duration: "3 min read",
    updatedAt: "Updated July 2026",
    featured: true,
  },
  {
    id: "high-quality-cpr-video",
    title: "High-quality CPR demonstration",
    summary: "Instructor-led demonstration of hand position, depth and recoil.",
    type: "video",
    topic: "Adult CPR",
    teachingStage: "Skills practice",
    audience: ["learner", "instructor"],
    duration: "7 min video",
    updatedAt: "Reviewed June 2026",
    featured: true,
  },
  {
    id: "initial-assessment-guide",
    title: "Initial assessment sequence",
    summary: "Scene safety, response and breathing checks at a glance.",
    type: "guide",
    topic: "Recognition",
    teachingStage: "Recognition",
    audience: ["learner", "instructor"],
    duration: "5 min read",
    updatedAt: "Updated May 2026",
  },
  {
    id: "airway-reference",
    title: "Airway and ventilation reference",
    summary: "Key ventilation technique and airway-positioning reminders.",
    type: "document",
    topic: "Airway",
    teachingStage: "Skills practice",
    audience: ["learner", "instructor"],
    duration: "6-page PDF",
    updatedAt: "Reviewed June 2026",
  },
  {
    id: "recovery-position-guide",
    title: "Recovery position guide",
    summary: "A step-by-step reference for a breathing, unresponsive adult.",
    type: "guide",
    topic: "Recovery",
    teachingStage: "Scenario and debrief",
    audience: ["learner", "instructor"],
    duration: "4 min read",
    updatedAt: "Updated April 2026",
  },
  {
    id: "course-opening-slides",
    title: "Course introduction slides",
    summary: "Opening slides covering objectives, schedule and safety.",
    type: "document",
    topic: "Recognition",
    teachingStage: "Opening",
    audience: ["instructor"],
    duration: "18 slides",
    updatedAt: "Updated July 2026",
  },
  {
    id: "scenario-debrief-checklist",
    title: "Scenario debrief checklist",
    summary: "Structured prompts for practical scenario feedback.",
    type: "checklist",
    topic: "Adult CPR",
    teachingStage: "Scenario and debrief",
    audience: ["instructor"],
    duration: "5 min",
    updatedAt: "Reviewed May 2026",
  },
];

const learnerProfile: DemoProfile = {
  id: "demo-learner-001",
  displayName: "Amina Rahman",
  roleTitle: "Course participant",
  organization: "Demo Clinical Training Centre",
  initials: "AR",
  email: "amina.rahman@example.test",
};

const instructorProfile: DemoProfile = {
  id: "demo-instructor-001",
  displayName: "Dr Sara Lim",
  roleTitle: "BLS instructor",
  organization: "Demo Clinical Training Centre",
  initials: "SL",
  email: "sara.lim@example.test",
};

const demoQuizzes: DemoQuiz[] = [
  {
    id: "pre-test",
    type: "pre-test",
    title: "BLS pre-test",
    questions: 10,
    timeMinutes: 8,
    status: "completed",
    availabilityNote: "Completed before the physical course",
    score: 70,
  },
  {
    id: "post-test",
    type: "post-test",
    title: "BLS post-test",
    questions: 15,
    timeMinutes: 15,
    status: "unreleased",
    availabilityNote:
      "An authorized instructor or administrator releases this after the course.",
  },
];

export const learnerSnapshot: LearnerSnapshot = {
  profile: learnerProfile,
  currentCohort,
  historicalCohorts: [completedCohort],
  quickGuideIds: [
    "adult-cpr-quick-guide",
    "aed-safety-checklist",
    "high-quality-cpr-video",
  ],
  quizzes: demoQuizzes,
  latestResult: {
    quizTitle: "BLS pre-test",
    score: 70,
    completedAt: "Completed 21 July 2026",
    topicResults: [
      { topic: "Recognition", score: 80 },
      { topic: "Adult CPR", score: 70 },
      { topic: "AED", score: 60 },
      { topic: "Airway", score: 70 },
    ],
  },
};

export const instructorSnapshot: InstructorSnapshot = {
  profile: instructorProfile,
  nextCohort: currentCohort,
  assignedCohorts: [currentCohort, completedCohort],
  recentResourceIds: [
    "course-opening-slides",
    "high-quality-cpr-video",
    "scenario-debrief-checklist",
  ],
  assignedLearners: [
    { id: "learner-1", name: "Amina Rahman", preTestStatus: "Completed" },
    { id: "learner-2", name: "Daniel Wong", preTestStatus: "Not completed" },
    { id: "learner-3", name: "Farah Yusuf", preTestStatus: "Completed" },
    { id: "learner-4", name: "Haris Lee", preTestStatus: "Completed" },
    { id: "learner-5", name: "Mei Chen", preTestStatus: "Not completed" },
  ],
};

const people: DemoPerson[] = [
  {
    id: "person-1",
    name: "Amina Rahman",
    role: "Learner",
    cohort: "BLS-2608",
    email: "amina.rahman@example.test",
    status: "Active",
  },
  {
    id: "person-2",
    name: "Daniel Wong",
    role: "Learner",
    cohort: "BLS-2608",
    email: "daniel.wong@example.test",
    status: "Invited",
  },
  {
    id: "person-3",
    name: "Dr Sara Lim",
    role: "Instructor",
    cohort: "2 cohorts",
    email: "sara.lim@example.test",
    status: "Active",
  },
  {
    id: "person-4",
    name: "Mei Chen",
    role: "Learner",
    cohort: "Not assigned",
    email: "mei.chen@example.test",
    status: "Needs assignment",
  },
  {
    id: "person-5",
    name: "Admin Example",
    role: "Administrator",
    cohort: "All cohorts",
    email: "admin@example.test",
    status: "Active",
  },
];

export const adminSnapshot: DemoAdminSnapshot = {
  upcomingCohorts: [currentCohort, secondUpcomingCohort],
  people,
  attentionItems: [
    {
      id: "attention-1",
      label: "Instructor assignment required",
      detail: "BLS-2610 has no instructor.",
      tone: "destructive",
    },
    {
      id: "attention-2",
      label: "Three learners need a cohort",
      detail: "Review unassigned learner records.",
      tone: "warning",
    },
    {
      id: "attention-3",
      label: "Pre-test follow-up",
      detail: "6 learners in BLS-2608 have not completed the pre-test.",
      tone: "info",
    },
  ],
  resources: demoResources,
  quizzes: demoQuizzes,
  topicComparison: [
    { topic: "Recognition", preTest: 68, postTest: 88 },
    { topic: "Adult CPR", preTest: 64, postTest: 86 },
    { topic: "AED", preTest: 58, postTest: 82 },
    { topic: "Airway", preTest: 62, postTest: 80 },
  ],
};
