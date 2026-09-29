export type CFUserRank = 'unrated' | 'newbie' | 'pupil' | 'specialist' | 'expert' | 'candidate master' | 'master' | 'international master' | 'grandmaster' | 'international grandmaster' | 'legendary grandmaster';
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
export type CFVerdict = 'FAILED' | 'OK' | 'PARTIAL' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'WRONG_ANSWER' | 'PRESENTATION_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'IDLENESS_LIMIT_EXCEEDED' | 'SECURITY_VIOLATED' | 'CRASH' | 'INPUT_PREPARATION_CRASHED' | 'CHALLENGED' | 'SKIPPED' | 'TESTING' | 'REJECTED';
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
        members: Array<{
            handle: string;
        }>;
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
export type CFContestPhase = 'BEFORE' | 'CODING' | 'PENDING_SYSTEM_TEST' | 'SYSTEM_TEST' | 'FINISHED';
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
    cfSubmissionId: number;
    contestId?: number | null;
    problemIndex: string;
    problemName: string;
    problemRating?: number | null;
    tags: string[];
    verdict: string;
    language: string;
    submittedAt: string;
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
    tagDistribution: Array<{
        tag: string;
        count: number;
    }>;
    difficultyDistribution: Array<{
        range: string;
        count: number;
    }>;
    contestParticipation: ContestParticipationRecord[];
}
export interface SyncResult {
    success: boolean;
    syncedStudentsCount: number;
    syncedContestsCount: number;
    errors: string[];
    timestamp: string;
}
