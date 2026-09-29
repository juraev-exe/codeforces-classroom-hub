import { prisma } from '@cf-hub/database';
import { codeforcesService } from '../codeforces/codeforces.service.js';
import { classesService } from '../classes/classes.service.js';
import { contestsService } from '../contests/contests.service.js';
import type { TeacherDashboardResponse, TeacherProfileOverview } from '@cf-hub/types';

export class TeacherService {
  async getDashboardData(): Promise<TeacherDashboardResponse> {
    const handle = process.env.TEACHER_CF_HANDLE || 'tourist';

    // 1. Fetch live or cached teacher stats from Codeforces API
    let teacherProfile: TeacherProfileOverview = {
      handle,
      name: 'Teacher',
      rating: 0,
      rank: 'unrated',
      maxRating: 0,
      maxRank: 'unrated',
      totalSolved: 0,
      totalContests: 0,
      avatar: 'https://userpic.codeforces.org/no-avatar.jpg',
      ratingHistory: [],
      recentSubmissions: [],
      tagStats: {},
    };

    try {
      const [cfUser] = await codeforcesService.getUserInfo([handle]);
      if (cfUser) {
        teacherProfile.handle = cfUser.handle;
        teacherProfile.name = `${cfUser.firstName || ''} ${cfUser.lastName || ''}`.trim() || cfUser.handle;
        teacherProfile.rating = cfUser.rating || 0;
        teacherProfile.rank = cfUser.rank || 'unrated';
        teacherProfile.maxRating = cfUser.maxRating || 0;
        teacherProfile.maxRank = cfUser.maxRank || 'unrated';
        teacherProfile.avatar = cfUser.avatar || cfUser.titlePhoto || teacherProfile.avatar;
      }

      const ratingHistory = await codeforcesService.getUserRatingHistory(handle);
      teacherProfile.ratingHistory = ratingHistory;
      teacherProfile.totalContests = ratingHistory.length;

      const submissions = await codeforcesService.getUserSubmissions(handle, 1, 50);
      const solvedSet = new Set<string>();
      const tagMap: Record<string, number> = {};

      for (const s of submissions) {
        if (s.verdict === 'OK') {
          solvedSet.add(`${s.problem.contestId}-${s.problem.index}`);
          for (const t of s.problem.tags || []) {
            tagMap[t] = (tagMap[t] || 0) + 1;
          }
        }
      }

      teacherProfile.totalSolved = solvedSet.size;
      teacherProfile.tagStats = tagMap;
      teacherProfile.recentSubmissions = submissions.slice(0, 15).map((s) => ({
        id: String(s.id),
        studentId: 'teacher',
        studentHandle: s.author.members[0]?.handle || handle,
        cfSubmissionId: s.id,
        contestId: s.contestId || null,
        problemIndex: s.problem.index,
        problemName: s.problem.name,
        problemRating: s.problem.rating || null,
        tags: s.problem.tags || [],
        verdict: s.verdict || 'UNKNOWN',
        language: s.programmingLanguage,
        submittedAt: new Date(s.creationTimeSeconds * 1000).toISOString(),
      }));
    } catch (err) {
      console.warn(`[TeacherService] Could not fetch teacher Codeforces data for ${handle}:`, err);
    }

    // 2. Fetch Class Summary & Leaderboard
    const classSummary = await classesService.getClassAnalytics();
    const leaderboard = await classesService.getLeaderboard();

    // 3. Fetch Upcoming Contests
    const upcomingContests = await contestsService.getUpcomingContests();

    return {
      teacher: teacherProfile,
      classSummary,
      leaderboard,
      upcomingContests,
    };
  }
}

export const teacherService = new TeacherService();
