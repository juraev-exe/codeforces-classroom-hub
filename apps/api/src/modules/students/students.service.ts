import { prisma } from '@cf-hub/database';
import { codeforcesService } from '../codeforces/codeforces.service.js';
import { syncService } from '../sync/sync.service.js';
import type { StudentDetailResponse } from '@cf-hub/types';

export class StudentsService {
  async getStudents(filters: {
    classId?: string;
    active?: boolean;
    search?: string;
  }) {
    const where: any = {};
    if (filters.classId) where.classId = filters.classId;
    if (filters.active !== undefined) where.active = filters.active;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { codeforcesHandle: { contains: filters.search } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        classroom: true,
        stats: true,
      },
      orderBy: {
        stats: {
          rating: 'desc',
        },
      },
    });

    return students.map((s: any) => ({
      id: s.id,
      name: s.name,
      codeforcesHandle: s.codeforcesHandle,
      classId: s.classId,
      className: s.classroom?.name,
      group: s.group,
      active: s.active,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      stats: s.stats
        ? {
            id: s.stats.id,
            studentId: s.stats.studentId,
            rating: s.stats.rating,
            rank: s.stats.rank,
            maxRating: s.stats.maxRating,
            maxRank: s.stats.maxRank,
            solvedCount: s.stats.solvedCount,
            contestCount: s.stats.contestCount,
            avatar: s.stats.avatar,
            lastSyncedAt: s.stats.lastSyncedAt.toISOString(),
          }
        : null,
    }));
  }

  async addStudent(data: {
    name: string;
    codeforcesHandle: string;
    classId: string;
    group?: string;
  }) {
    const handle = data.codeforcesHandle.trim();

    // 1. Verify uniqueness
    const existing = await prisma.student.findUnique({
      where: { codeforcesHandle: handle },
    });
    if (existing) {
      throw new Error(`Student with handle "${handle}" already exists in the system.`);
    }

    // 2. Validate with Codeforces API
    const cfUser = await codeforcesService.validateHandle(handle);
    if (!cfUser) {
      throw new Error(`Codeforces handle "${handle}" does not exist on Codeforces.`);
    }

    // 3. Create student record
    const student = await prisma.student.create({
      data: {
        name: data.name.trim(),
        codeforcesHandle: handle,
        classId: data.classId,
        group: data.group?.trim() || null,
        active: true,
      },
      include: {
        classroom: true,
      },
    });

    // 4. Trigger initial background sync for this student
    syncService.syncStudent(student.id).catch((err) => {
      console.error(`Initial sync error for ${handle}:`, err);
    });

    return student;
  }

  async getStudentById(id: string): Promise<StudentDetailResponse | null> {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        classroom: true,
        stats: true,
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 50,
        },
        contestParticipations: {
          include: { contest: true },
          orderBy: { contest: { startTime: 'desc' } },
        },
      },
    });

    if (!student) return null;

    // Fetch live or cached rating history from Codeforces API
    let ratingHistory: any[] = [];
    try {
      ratingHistory = await codeforcesService.getUserRatingHistory(student.codeforcesHandle);
    } catch {
      ratingHistory = [];
    }

    // Calculate tag distribution & difficulty distribution from submissions
    const tagCountMap: Record<string, number> = {};
    const difficultyBuckets: Record<string, number> = {
      '< 1000': 0,
      '1000 - 1399': 0,
      '1400 - 1599': 0,
      '1600 - 1899': 0,
      '1900 - 2199': 0,
      '2200+': 0,
    };

    for (const sub of student.submissions) {
      if (sub.verdict === 'OK') {
        try {
          const tags: string[] = JSON.parse(sub.tags || '[]');
          for (const t of tags) {
            tagCountMap[t] = (tagCountMap[t] || 0) + 1;
          }
        } catch {
          // ignore tag json parse error
        }

        if (sub.problemRating) {
          const r = sub.problemRating;
          if (r < 1000) difficultyBuckets['< 1000']++;
          else if (r < 1400) difficultyBuckets['1000 - 1399']++;
          else if (r < 1600) difficultyBuckets['1400 - 1599']++;
          else if (r < 1900) difficultyBuckets['1600 - 1899']++;
          else if (r < 2200) difficultyBuckets['1900 - 2199']++;
          else difficultyBuckets['2200+']++;
        }
      }
    }

    const tagDistribution = Object.entries(tagCountMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const difficultyDistribution = Object.entries(difficultyBuckets).map(
      ([range, count]) => ({ range, count })
    );

    return {
      student: {
        id: student.id,
        name: student.name,
        codeforcesHandle: student.codeforcesHandle,
        classId: student.classId,
        className: student.classroom.name,
        group: student.group,
        active: student.active,
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString(),
      },
      stats: student.stats
        ? {
            id: student.stats.id,
            studentId: student.stats.studentId,
            rating: student.stats.rating,
            rank: student.stats.rank,
            maxRating: student.stats.maxRating,
            maxRank: student.stats.maxRank,
            solvedCount: student.stats.solvedCount,
            contestCount: student.stats.contestCount,
            avatar: student.stats.avatar,
            lastSyncedAt: student.stats.lastSyncedAt.toISOString(),
          }
        : null,
      ratingHistory,
      recentSubmissions: student.submissions.map((sub: any) => ({
        id: sub.id,
        studentId: sub.studentId,
        cfSubmissionId: sub.cfSubmissionId,
        contestId: sub.contestId,
        problemIndex: sub.problemIndex,
        problemName: sub.problemName,
        problemRating: sub.problemRating,
        tags: (() => {
          try {
            return JSON.parse(sub.tags);
          } catch {
            return [];
          }
        })(),
        verdict: sub.verdict,
        language: sub.language,
        submittedAt: sub.submittedAt.toISOString(),
      })),
      tagDistribution,
      difficultyDistribution,
      contestParticipation: student.contestParticipations.map((cp: any) => ({
        id: cp.id,
        contestId: cp.contestId,
        studentId: cp.studentId,
        rank: cp.rank,
        ratingBefore: cp.ratingBefore,
        ratingAfter: cp.ratingAfter,
        ratingChange: cp.ratingChange,
        problemsSolved: cp.problemsSolved,
      })),
    };
  }

  async updateStudent(
    id: string,
    data: {
      name?: string;
      classId?: string;
      group?: string | null;
      active?: boolean;
    }
  ) {
    return prisma.student.update({
      where: { id },
      data,
    });
  }

  async deleteStudent(id: string) {
    return prisma.student.delete({
      where: { id },
    });
  }
}

export const studentsService = new StudentsService();
