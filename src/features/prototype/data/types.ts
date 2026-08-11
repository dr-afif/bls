export type DemoResourceType = "guide" | "checklist" | "document" | "video";

export type DemoResource = {
  id: string;
  title: string;
  summary: string;
  type: DemoResourceType;
  topic: "Recognition" | "Adult CPR" | "Airway" | "AED" | "Recovery";
  teachingStage:
    | "Opening"
    | "Recognition"
    | "Skills practice"
    | "Scenario and debrief";
  audience: Array<"learner" | "instructor">;
  duration: string;
  updatedAt: string;
  featured?: boolean;
};

export type DemoCohort = {
  id: string;
  code: string;
  courseName: string;
  date: string;
  time: string;
  venue: string;
  instructor: string;
  contact: string;
  preparationNotes: string;
  status: "upcoming" | "in-progress" | "completed" | "needs-attention";
  learnerCount: number;
  preTestCompleted: number;
  postTestReleased: boolean;
};

export type DemoProfile = {
  id: string;
  displayName: string;
  roleTitle: string;
  organization: string;
  initials: string;
  email: string;
};

export type DemoQuiz = {
  id: string;
  type: "pre-test" | "post-test";
  title: string;
  questions: number;
  timeMinutes: number;
  status: "available" | "completed" | "unreleased";
  availabilityNote: string;
  score?: number;
};

export type TopicResult = {
  topic: string;
  score: number;
};

export type DemoResult = {
  quizTitle: string;
  score: number;
  completedAt: string;
  topicResults: TopicResult[];
};

export type LearnerSnapshot = {
  profile: DemoProfile;
  currentCohort: DemoCohort;
  historicalCohorts: DemoCohort[];
  quickGuideIds: string[];
  quizzes: DemoQuiz[];
  latestResult: DemoResult;
};

export type InstructorSnapshot = {
  profile: DemoProfile;
  nextCohort: DemoCohort;
  assignedCohorts: DemoCohort[];
  recentResourceIds: string[];
  assignedLearners: Array<{
    id: string;
    name: string;
    preTestStatus: "Completed" | "Not completed";
  }>;
};

export type DemoPerson = {
  id: string;
  name: string;
  role: "Learner" | "Instructor" | "Administrator";
  cohort: string;
  email: string;
  status: "Active" | "Invited" | "Needs assignment" | "Suspended";
};

export type DemoAdminSnapshot = {
  upcomingCohorts: DemoCohort[];
  people: DemoPerson[];
  attentionItems: Array<{
    id: string;
    label: string;
    detail: string;
    tone: "warning" | "destructive" | "info";
  }>;
  resources: DemoResource[];
  quizzes: DemoQuiz[];
  topicComparison: Array<{
    topic: string;
    preTest: number;
    postTest: number;
  }>;
};
