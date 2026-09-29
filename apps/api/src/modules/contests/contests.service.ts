import { prisma } from '@cf-hub/database';
import { syncService } from '../sync/sync.service.js';
import type { ContestRecord } from '@cf-hub/types';

export class ContestsService {
  async getUpcomingContests(): Promise<ContestRecord[]> {
    const contests = await prisma.contest.findMany({
      where: {
        OR: [
          { phase: 'BEFORE' },
          { phase: 'CODING' },
          { startTime: { gte: new Date() } },
        ],
      },
      orderBy: { startTime: 'asc' },
      take: 20,
    });

    return contests.map((c: any) => ({
      id: c.id,
      codeforcesContestId: c.codeforcesContestId,
      name: c.name,
      phase: c.phase as any,
      startTime: c.startTime.toISOString(),
      durationSeconds: c.durationSeconds,
      lastSyncedAt: c.lastSyncedAt.toISOString(),
    }));
  }

  async getAllContests(limit: number = 50): Promise<ContestRecord[]> {
    const contests = await prisma.contest.findMany({
      orderBy: { startTime: 'desc' },
      take: limit,
    });

    return contests.map((c: any) => ({
      id: c.id,
      codeforcesContestId: c.codeforcesContestId,
      name: c.name,
      phase: c.phase as any,
      startTime: c.startTime.toISOString(),
      durationSeconds: c.durationSeconds,
      lastSyncedAt: c.lastSyncedAt.toISOString(),
    }));
  }

  async syncContests(): Promise<number> {
    return syncService.syncContests();
  }
}

export const contestsService = new ContestsService();
