import cron from 'node-cron';
import { prisma } from '@cf-hub/database';
import { codeforcesService } from '../codeforces/codeforces.service.js';
import type { SyncResult } from '@cf-hub/types';

export class SyncService {
  private isSyncing = false;

  async syncStudent(studentId: string): Promise<boolean> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) return false;

    try {
      // 1. Fetch CF User info
      const [cfUser] = await codeforcesService.getUserInfo([student.codeforcesHandle]);
      if (!cfUser) {
        console.warn(`[Sync] Handle not found on Codeforces: ${student.codeforcesHandle}`);
        return false;
      }

      // 2. Fetch rating changes
      let ratingChanges: any[] = [];
      try {
        ratingChanges = await codeforcesService.getUserRatingHistory(student.codeforcesHandle);
      } catch (err) {
        console.warn(`[Sync] Error fetching rating history for ${student.codeforcesHandle}:`, err);
      }

      // 3. Fetch submissions (recent 100)
      let submissions: any[] = [];
      try {
        submissions = await codeforcesService.getUserSubmissions(student.codeforcesHandle, 1, 100);
      } catch (err) {
        console.warn(`[Sync] Error fetching submissions for ${student.codeforcesHandle}:`, err);
      }

      // Unique solved problems count (verdict === 'OK')
      const solvedProblemsSet = new Set<string>();
      for (const sub of submissions) {
        if (sub.verdict === 'OK') {
          const problemKey = `${sub.problem.contestId || ''}-${sub.problem.index}`;
          solvedProblemsSet.add(problemKey);
        }
      }

      // 4. Upsert StudentStats
      await prisma.studentStats.upsert({
        where: { studentId: student.id },
        update: {
          rating: cfUser.rating || 0,
          rank: cfUser.rank || 'unrated',
          maxRating: cfUser.maxRating || 0,
          maxRank: cfUser.maxRank || 'unrated',
          solvedCount: solvedProblemsSet.size,
          contestCount: ratingChanges.length,
          avatar: cfUser.avatar || cfUser.titlePhoto || null,
          lastSyncedAt: new Date(),
        },
        create: {
          studentId: student.id,
          rating: cfUser.rating || 0,
          rank: cfUser.rank || 'unrated',
          maxRating: cfUser.maxRating || 0,
          maxRank: cfUser.maxRank || 'unrated',
          solvedCount: solvedProblemsSet.size,
          contestCount: ratingChanges.length,
          avatar: cfUser.avatar || cfUser.titlePhoto || null,
          lastSyncedAt: new Date(),
        },
      });

      // 5. Upsert recent submissions
      for (const sub of submissions.slice(0, 30)) {
        await prisma.submission.upsert({
          where: { cfSubmissionId: sub.id },
          update: {
            verdict: sub.verdict || 'UNKNOWN',
          },
          create: {
            studentId: student.id,
            cfSubmissionId: sub.id,
            contestId: sub.contestId || null,
            problemIndex: sub.problem.index,
            problemName: sub.problem.name,
            problemRating: sub.problem.rating || null,
            tags: JSON.stringify(sub.problem.tags || []),
            verdict: sub.verdict || 'UNKNOWN',
            language: sub.programmingLanguage,
            submittedAt: new Date(sub.creationTimeSeconds * 1000),
          },
        });
      }

      console.log(`[Sync] Successfully synced student: ${student.name} (@${student.codeforcesHandle})`);
      return true;
    } catch (error) {
      console.error(`[Sync] Failed to sync student ${student.codeforcesHandle}:`, error);
      return false;
    }
  }

  async syncAllStudents(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        syncedStudentsCount: 0,
        syncedContestsCount: 0,
        errors: ['Sync is already in progress'],
        timestamp: new Date().toISOString(),
      };
    }

    this.isSyncing = true;
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      const activeStudents = await prisma.student.findMany({
        where: { active: true },
      });

      for (const student of activeStudents) {
        const success = await this.syncStudent(student.id);
        if (success) {
          syncedCount++;
        } else {
          errors.push(`Failed to sync handle: ${student.codeforcesHandle}`);
        }
      }

      return {
        success: errors.length === 0,
        syncedStudentsCount: syncedCount,
        syncedContestsCount: 0,
        errors,
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.isSyncing = false;
    }
  }

  async syncContests(): Promise<number> {
    try {
      const contests = await codeforcesService.getContestList(false);
      let count = 0;

      // Keep upcoming and recent contests (within last 30 days)
      const thirtyDaysAgo = Date.now() / 1000 - 30 * 24 * 3600;

      for (const c of contests) {
        if (c.phase === 'BEFORE' || (c.startTimeSeconds && c.startTimeSeconds > thirtyDaysAgo)) {
          await prisma.contest.upsert({
            where: { codeforcesContestId: c.id },
            update: {
              name: c.name,
              phase: c.phase,
              startTime: new Date((c.startTimeSeconds || 0) * 1000),
              durationSeconds: c.durationSeconds,
              lastSyncedAt: new Date(),
            },
            create: {
              codeforcesContestId: c.id,
              name: c.name,
              phase: c.phase,
              startTime: new Date((c.startTimeSeconds || 0) * 1000),
              durationSeconds: c.durationSeconds,
              lastSyncedAt: new Date(),
            },
          });
          count++;
        }
      }

      console.log(`[Sync] Synced ${count} upcoming and recent contests.`);
      return count;
    } catch (err) {
      console.error('[Sync] Error syncing contests from Codeforces:', err);
      return 0;
    }
  }

  initCronJobs(): void {
    console.log('[Sync] Initializing background cron jobs...');

    // Sync active students every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      console.log('[Cron] Running scheduled student synchronization...');
      await this.syncAllStudents();
    });

    // Sync upcoming contests every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      console.log('[Cron] Running scheduled contest synchronization...');
      await this.syncContests();
    });
  }
}

export const syncService = new SyncService();
