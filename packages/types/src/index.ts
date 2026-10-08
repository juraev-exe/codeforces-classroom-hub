// ==========================================
// Codeforces Official API Response Types
// ==========================================

export type CFUserRank =
  | 'unrated'
  | 'newbie'
  | 'pupil'
  | 'specialist'
  | 'expert'
  | 'candidate master'
  | 'master'
  | 'international master'
  | 'grandmaster'
  | 'international grandmaster'
  | 'legendary grandmaster';

export interface CFUser {
  handle: string;
  email?: string;
  vkId?: string;
  openId?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank?: string;
  rating?: number;
  maxRank?: string;
  maxRating?: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
  friendOfCount: number;
  avatar: string;
  titlePhoto: string;
}

export interface CFRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export type CFVerdict =
  | 'FAILED'
  | 'OK'
  | 'PARTIAL'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'WRONG_ANSWER'
  | 'PRESENTATION_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'IDLENESS_LIMIT_EXCEEDED'
  | 'SECURITY_VIOLATED'
  | 'CRASH'
  | 'INPUT_PREPARATION_CRASHED'
  | 'CHALLENGED'
  | 'SKIPPED'
  | 'TESTING'
  | 'REJECTED';

export interface CFProblem {
  contestId?: number;
  problemsetName?: string;
  index: string;
  name: string;
  type: 'PROGRAMMING' | 'QUESTION';
  points?: number;
  rating?: number;
  tags: string[];
}

export interface CFSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: CFProblem;
  author: {
    contestId?: number;
    members: Array<{ handle: string }>;
    participantType: 'CONTESTANT' | 'PRACTICE' | 'VIRTUAL' | 'MANAGER' | 'OUT_OF_COMPETITION';
    ghost: boolean;
    startTimeSeconds?: number;
  };
  programmingLanguage: string;
  verdict?: CFVerdict;
  testset: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
}

export type CFContestPhase =
  | 'BEFORE'
  | 'CODING'
  | 'PENDING_SYSTEM_TEST'
  | 'SYSTEM_TEST'
  | 'FINISHED';

export type CFContestType = 'CF' | 'IOI' | 'ICPC';

export interface CFContest {
  id: number;
  name: string;
  type: CFContestType;
  phase: CFContestPhase;
  frozen: boolean;
  durationSeconds: number;
  startTimeSeconds?: number;
  relativeTimeSeconds?: number;
  preparedBy?: string;
  websiteUrl?: string;
  description?: string;
  difficulty?: number;
  kind?: string;
  icpcRegion?: string;
  country?: string;
  city?: string;
  season?: string;
}

export interface CFApiResponse<T> {
  status: 'OK' | 'FAILED';
  comment?: string;
  result?: T;
}

// ==========================================
// Application Core Entities
// ==========================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'admin';
  codeforcesHandle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  codeforcesHandle: string;
  classId: string;
  group?: string | null;
  age?: number | null;
  telegramUsername?: string | null;
  telegramChatId?: string | number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  className?: string;
  stats?: StudentStats | null;
}

export interface Classroom {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
}

export interface StudentStats {
  id: string;
  studentId: string;
  rating: number;
  rank: string;
  maxRating: number;
  maxRank: string;
  solvedCount: number;
  contestCount: number;
  avatar?: string | null;
  lastSyncedAt: string;
}

export interface SubmissionRecord {
  id: string;
  studentId: string;
  studentHandle?: string;
  studentName?: string;
  studentAvatar?: string;
  cfSubmissionId: number;
  contestId?: number | null;
  problemIndex: string;
  problemName: string;
  problemRating?: number | null;
  tags: string[];
  verdict: string;
  language: string;
  submittedAt: string;
  timeConsumedMillis?: number;
  memoryConsumedBytes?: number;
  passedTestCount?: number;
}

export interface ContestRecord {
  id: string;
  codeforcesContestId: number;
  name: string;
  phase: CFContestPhase;
  startTime: string;
  durationSeconds: number;
  lastSyncedAt: string;
  participatingStudentsCount?: number;
}

export interface ContestParticipationRecord {
  id: string;
  contestId: string;
  studentId: string;
  studentHandle?: string;
  studentName?: string;
  rank: number;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  problemsSolved: number;
}

// ==========================================
// DTOs & Analytical Summaries
// ==========================================

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  handle: string;
  className: string;
  rating: number;
  maxRating: number;
  rankTitle: string;
  solvedCount: number;
  contestCount: number;
  recentRatingChange: number;
  avatar?: string;
  active: boolean;
}

export interface TeacherProfileOverview {
  handle: string;
  name: string;
  rating: number;
  rank: string;
  maxRating: number;
  maxRank: string;
  totalSolved: number;
  totalContests: number;
  avatar: string;
  ratingHistory: CFRatingChange[];
  recentSubmissions: SubmissionRecord[];
  tagStats: Record<string, number>;
}

export interface TopicStrength {
  topic: string;
  successRate: number;
  totalAttempts: number;
  solved: number;
  failed: number;
  status: 'mastered' | 'practicing' | 'needs_attention';
}

export interface RecommendedProblem {
  name: string;
  url: string;
  fails: number;
  solves: number;
  rating: number;
}

export interface StudentComparisonRecord {
  studentId: string;
  name: string;
  handle: string;
  avatar?: string;
  rating: number;
  maxRating?: number;
  rank: string;
  solvedCount: number;
  totalSubmissions: number;
  accuracyRate: number;
  recentRatingChange: number;
  lastActive: string | null;
  topTag: string;
}

export interface DailyActivityRecord {
  date: string;
  count: number;
  solved: number;
  failed: number;
}

export interface HourlyActivityRecord {
  hour: number;
  label: string;
  count: number;
}

export interface VerdictDistributionRecord {
  verdict: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface DifficultyDistributionRecord {
  range: string;
  count: number;
  solved: number;
  failed: number;
}

export interface LanguageDistributionRecord {
  language: string;
  count: number;
  percentage: number;
}

export interface ClassSummary {
  totalStudents: number;
  activeStudents: number;
  averageRating: number;
  medianRating: number;
  highestRating: number;
  lowestRating: number;
  totalSolvedProblems: number;
  averageSolvedProblems: number;
  totalContestsParticipated: number;
  ratingDistribution: Array<{
    range: string;
    count: number;
  }>;
  mostImprovedStudents: Array<{
    studentId: string;
    name: string;
    handle: string;
    ratingChange: number;
    currentRating: number;
  }>;
  recentActivity: SubmissionRecord[];
  verdictDistribution?: VerdictDistributionRecord[];
  difficultyDistribution?: DifficultyDistributionRecord[];
  dailyActivity?: DailyActivityRecord[];
  hourlyActivity?: HourlyActivityRecord[];
  languageDistribution?: LanguageDistributionRecord[];
  topicStrengths?: TopicStrength[];
  weakTopics?: Array<{
    topic: string;
    successRate: number;
    totalAttempts: number;
  }>;
  recommendedProblems?: RecommendedProblem[];
  studentComparison?: StudentComparisonRecord[];
  statsSummary?: {
    accuracyRate: number;
    totalSubmissions: number;
    activeCodersStreak: number;
    hardestProblemSolved: {
      name: string;
      rating: number;
      solvedBy: string;
      url: string;
    } | null;
    fastestSolveTimeMs: number | null;
    peakHourLabel: string;
  };
}

export interface TeacherDashboardResponse {
  teacher: TeacherProfileOverview;
  classSummary: ClassSummary;
  leaderboard: LeaderboardEntry[];
  upcomingContests: ContestRecord[];
}

export interface StudentDetailResponse {
  student: Student;
  stats: StudentStats | null;
  ratingHistory: CFRatingChange[];
  recentSubmissions: SubmissionRecord[];
  tagDistribution: Array<{ tag: string; count: number }>;
  difficultyDistribution: Array<{ range: string; count: number }>;
  contestParticipation: ContestParticipationRecord[];
}

export interface SyncResult {
  success: boolean;
  syncedStudentsCount: number;
  syncedContestsCount: number;
  errors: string[];
  timestamp: string;
}

export interface AssignmentProblem {
  id: string; // e.g. "1941A" or "4A"
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  url: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  classId: string;
  className?: string;
  problems: AssignmentProblem[];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAssignmentProgress {
  studentId: string;
  studentName: string;
  handle: string;
  avatar?: string;
  solvedCount: number;
  totalCount: number;
  completed: boolean;
  solvedProblemIds: string[];
}

export interface AssignmentWithProgress extends Assignment {
  studentProgress: StudentAssignmentProgress[];
  completionRate: number; // percentage
}

// ==========================================
// Platform Customization & Settings Types
// ==========================================

export type BrandTheme = 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'cyan';
export type LeaderboardMetric = 'rating' | 'solved' | 'contests';
export type DensityMode = 'comfortable' | 'compact';
export type PotdTarget = 'all' | '800-1200' | '1200-1600' | '1600-2000';

export interface AppSettings {
  teacherName: string;
  teacherHandle: string;
  teacherTitle?: string;
  acmpId?: string;
  telegramBotToken?: string;
  telegramAdminIds?: string;
  contestAlertEnabled: boolean;
  contestAlertMinutesBefore: number;
  ratingDigestEnabled: boolean;
  pollIntervalMinutes: number;
  cfApiKey?: string;
  cfApiSecret?: string;
  lastNotifiedContestIds?: (string | number)[];

  // White-label & Academy Branding
  academyName?: string;
  academyTagline?: string;
  academyLogoText?: string;
  brandTheme?: BrandTheme;

  // Leaderboard & Competition Customization
  leaderboardRankingMetric?: LeaderboardMetric;
  showUnratedInLeaderboard?: boolean;
  minRatingFilter?: number;

  // Telegram Bot Customization
  telegramWelcomeMessage?: string;
  potdRatingTarget?: PotdTarget;

  // Report Card & Certification
  reportCardIssuer?: string;
  reportCardAccreditation?: string;
  reportCardShowSignature?: boolean;

  // UI & Display Preferences
  densityMode?: DensityMode;
}

