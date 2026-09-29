import { prisma } from '@cf-hub/database';
import type { ClassSummary, LeaderboardEntry } from '@cf-hub/types';

export class ClassesService {
  async getClasses() {
    const classes = await prisma.classroom.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      studentCount: c._count.students,
    }));
  }

  async createClass(name: string, description?: string) {
    return prisma.classroom.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });
  }

  async getClassById(id: string) {
    return prisma.classroom.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            stats: true,
          },
        },
      },
    });
  }

  async getLeaderboard(classId?: string): Promise<LeaderboardEntry[]> {
    const where: any = { active: true };
    if (classId) {
      where.classId = classId;
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        classroom: true,
        stats: true,
        contestParticipations: {
          orderBy: { contest: { startTime: 'desc' } },
          take: 1,
        },
      },
      orderBy: {
        stats: {
          rating: 'desc',
        },
      },
    });

    return students.map((s: any, index: number) => {
      const recentChange = s.contestParticipations[0]?.ratingChange || 0;
      return {
        rank: index + 1,
        studentId: s.id,
        name: s.name,
        handle: s.codeforcesHandle,
        className: s.classroom.name,
        rating: s.stats?.rating || 0,
        maxRating: s.stats?.maxRating || 0,
        rankTitle: s.stats?.rank || 'unrated',
        solvedCount: s.stats?.solvedCount || 0,
        contestCount: s.stats?.contestCount || 0,
        recentRatingChange: recentChange,
        avatar: s.stats?.avatar || undefined,
        active: s.active,
      };
    });
  }

  async getClassAnalytics(classId?: string): Promise<ClassSummary> {
    const where: any = {};
    if (classId) {
      where.classId = classId;
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        stats: true,
        submissions: {
          where: { verdict: 'OK' },
          take: 50,
          orderBy: { submittedAt: 'desc' },
        },
        contestParticipations: {
          orderBy: { contest: { startTime: 'desc' } },
          take: 1,
        },
      },
    });

    const totalStudents = students.length;
    const activeStudents = students.filter((s: any) => s.active).length;

    const ratedStudents = students.filter((s: any) => s.stats && s.stats.rating > 0);
    const ratings = ratedStudents
      .map((s: any) => s.stats!.rating as number)
      .sort((a: number, b: number) => a - b);

    const averageRating =
      ratings.length > 0
        ? Math.round(ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length)
        : 0;

    let medianRating = 0;
    if (ratings.length > 0) {
      const mid = Math.floor(ratings.length / 2);
      medianRating =
        ratings.length % 2 !== 0
          ? ratings[mid]
          : Math.round((ratings[mid - 1] + ratings[mid]) / 2);
    }

    const highestRating = ratings.length > 0 ? ratings[ratings.length - 1] : 0;
    const lowestRating = ratings.length > 0 ? ratings[0] : 0;

    const totalSolvedProblems = students.reduce(
      (acc: number, s: any) => acc + (s.stats?.solvedCount || 0),
      0
    );

    const averageSolvedProblems =
      totalStudents > 0 ? Math.round(totalSolvedProblems / totalStudents) : 0;

    const totalContestsParticipated = students.reduce(
      (acc: number, s: any) => acc + (s.stats?.contestCount || 0),
      0
    );

    // Rating distribution buckets
    const ratingBuckets: Record<string, number> = {
      'Newbie (<1200)': 0,
      'Pupil (1200-1399)': 0,
      'Specialist (1400-1599)': 0,
      'Expert (1600-1899)': 0,
      'Candidate Master (1900-2199)': 0,
      'Master+ (2200+)': 0,
    };

    for (const r of ratings) {
      if (r < 1200) ratingBuckets['Newbie (<1200)']++;
      else if (r < 1400) ratingBuckets['Pupil (1200-1399)']++;
      else if (r < 1600) ratingBuckets['Specialist (1400-1599)']++;
      else if (r < 1900) ratingBuckets['Expert (1600-1899)']++;
      else if (r < 2200) ratingBuckets['Candidate Master (1900-2199)']++;
      else ratingBuckets['Master+ (2200+)']++;
    }

    const ratingDistribution = Object.entries(ratingBuckets).map(
      ([range, count]) => ({ range, count })
    );

    // Most improved students
    const mostImprovedStudents = students
      .map((s: any) => ({
        studentId: s.id,
        name: s.name,
        handle: s.codeforcesHandle,
        ratingChange: s.contestParticipations[0]?.ratingChange || 0,
        currentRating: s.stats?.rating || 0,
      }))
      .filter((s: any) => s.ratingChange !== 0)
      .sort((a: any, b: any) => b.ratingChange - a.ratingChange)
      .slice(0, 5);

    // Recent activity across all students
    const recentSubmissions = await prisma.submission.findMany({
      where: classId ? { student: { classId } } : undefined,
      include: {
        student: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });

    return {
      totalStudents,
      activeStudents,
      averageRating,
      medianRating,
      highestRating,
      lowestRating,
      totalSolvedProblems,
      averageSolvedProblems,
      totalContestsParticipated,
      ratingDistribution,
      mostImprovedStudents,
      recentActivity: recentSubmissions.map((sub: any) => ({
        id: sub.id,
        studentId: sub.studentId,
        studentName: sub.student.name,
        studentHandle: sub.student.codeforcesHandle,
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
    };
  }
}

export const classesService = new ClassesService();
