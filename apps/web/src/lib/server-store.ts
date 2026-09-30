import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';

export interface ClassroomData {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
}

export interface StudentStatsData {
  id: string;
  studentId: string;
  rating: number;
  rank: string;
  maxRating: number;
  maxRank: string;
  solvedCount: number;
  contestCount: number;
  avatar: string;
  lastSyncedAt: string;
  lastOnlineTimeSeconds?: number;
}

export interface StudentData {
  id: string;
  name: string;
  codeforcesHandle: string;
  classId: string;
  className?: string;
  group?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  stats: StudentStatsData | null;
  submissions?: any[];
  contestParticipations?: any[];
}

function getStorageFile(): string {
  // First, prefer local project workspace if exists
  const localFile = path.resolve(process.cwd(), 'classroom_data.json');
  try {
    if (fs.existsSync(localFile)) {
      return localFile;
    }
    fs.writeFileSync(localFile, '', { flag: 'a' });
    return localFile;
  } catch {
    return path.join(process.env.TEMP || process.env.TMP || '/tmp', 'cf_hub_store_v1.json');
  }
}

const STORAGE_FILE = getStorageFile();

// Initial state
const INITIAL_CLASSES: ClassroomData[] = [
  {
    id: 'class-algorithms-2026',
    name: 'Algorithms & Competitive Programming 2026',
    description:
      'Official competitive programming and algorithms training batch led by Abubakr Juraev.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    studentCount: 1,
  },
];

const INITIAL_STUDENTS: StudentData[] = [
  {
    id: '46427f87-007e-4327-bca3-e9e9b3056a9c',
    name: 'Abubakr Juraev',
    codeforcesHandle: 'AbubakrJ',
    classId: 'class-algorithms-2026',
    className: 'Algorithms & Competitive Programming 2026',
    group: 'Teacher & Lead',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    stats: {
      id: 'stats-abubakrj',
      studentId: '46427f87-007e-4327-bca3-e9e9b3056a9c',
      rating: 693,
      rank: 'newbie',
      maxRating: 693,
      maxRank: 'newbie',
      solvedCount: 58,
      contestCount: 1,
      avatar: 'https://userpic.codeforces.org/1970880/title/66afacde68a45195.jpg',
      lastSyncedAt: new Date().toISOString(),
    },
    submissions: [],
    contestParticipations: [],
  },
];

interface StoreSchema {
  classes: ClassroomData[];
  students: StudentData[];
}

function loadStore(): StoreSchema {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed.classes) && Array.isArray(parsed.students)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read persistent store, using initial data:', err);
  }
  return { classes: [...INITIAL_CLASSES], students: [...INITIAL_STUDENTS] };
}

function saveStore(data: StoreSchema) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist store to disk:', err);
  }
}

// In-memory cache
let memoryStore = loadStore();

export async function fetchCF<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const url = `https://codeforces.com/api/${endpoint}${query ? `?${query}` : ''}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Codeforces-Classroom-Hub/1.0',
      Accept: 'application/json',
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Codeforces API returned HTTP ${res.status}`);
  }

  const json = await res.json();
  if (json.status !== 'OK') {
    throw new Error(json.comment || 'Codeforces API error');
  }
  return json.result as T;
}

export const serverStore = {
  async syncFromSupabase(): Promise<void> {
    try {
      const { data, error } = await supabase.from('students').select('*');
      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          const fetched: StudentData[] = data.map((row: any) => ({
            id: row.id,
            name: row.name,
            codeforcesHandle: row.codeforces_handle || row.codeforcesHandle,
            classId: row.class_id || row.classId || 'class-algorithms-2026',
            className: row.class_name || row.className || 'Algorithms & Competitive Programming 2026',
            group: row.group || 'Student',
            active: row.active ?? true,
            createdAt: row.created_at || row.createdAt || new Date().toISOString(),
            updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
            stats: row.stats || null,
            submissions: row.submissions || [],
            contestParticipations: row.contest_participations || row.contestParticipations || [],
          }));

          const handleMap = new Map<string, StudentData>();
          for (const s of INITIAL_STUDENTS) {
            handleMap.set(s.codeforcesHandle.toLowerCase(), s);
          }
          for (const s of memoryStore.students) {
            handleMap.set(s.codeforcesHandle.toLowerCase(), s);
          }
          for (const s of fetched) {
            handleMap.set(s.codeforcesHandle.toLowerCase(), s);
          }
          memoryStore.students = Array.from(handleMap.values());
          saveStore(memoryStore);
        } else {
          // If Supabase table exists but is empty, seed initial teacher student
          for (const s of INITIAL_STUDENTS) {
            await supabase.from('students').upsert({
              id: s.id,
              name: s.name,
              codeforces_handle: s.codeforcesHandle,
              class_id: s.classId,
              class_name: s.className,
              group: s.group,
              active: s.active,
              stats: s.stats,
              submissions: s.submissions || [],
              contest_participations: s.contestParticipations || [],
              created_at: s.createdAt,
              updated_at: s.updatedAt,
            }, { onConflict: 'codeforces_handle' });
          }
        }
      }
    } catch (err) {
      console.warn('[Supabase Sync] Warning:', err);
    }
  },

  getClassrooms(): ClassroomData[] {
    const counts: Record<string, number> = {};
    for (const s of memoryStore.students) {
      counts[s.classId] = (counts[s.classId] || 0) + 1;
    }
    return memoryStore.classes.map((c) => ({
      ...c,
      studentCount: counts[c.id] || 0,
    }));
  },

  addClassroom(name: string, description?: string): ClassroomData {
    const id = `class-${Date.now()}`;
    const newClass: ClassroomData = {
      id,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      studentCount: 0,
    };
    memoryStore.classes.push(newClass);
    saveStore(memoryStore);
    return newClass;
  },

  getStudents(classId?: string, search?: string): StudentData[] {
    memoryStore = loadStore();
    let list = memoryStore.students;
    if (classId) {
      list = list.filter((s) => s.classId === classId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.codeforcesHandle.toLowerCase().includes(q)
      );
    }
    return list;
  },

  getStudentById(id: string): StudentData | null {
    return memoryStore.students.find((s) => s.id === id) || null;
  },

  async addStudent(data: {
    name: string;
    codeforcesHandle: string;
    classId: string;
    group?: string;
  }): Promise<StudentData> {
    const handle = data.codeforcesHandle.trim();
    const existing = memoryStore.students.find(
      (s) => s.codeforcesHandle.toLowerCase() === handle.toLowerCase()
    );
    if (existing) {
      throw new Error(`Student with handle "${handle}" is already enrolled.`);
    }

    // Verify with Codeforces API
    const users = await fetchCF<any[]>('user.info', { handles: handle });
    if (!users || users.length === 0) {
      throw new Error(`Codeforces handle "${handle}" was not found.`);
    }
    const cfUser = users[0];

    // Fetch user submissions for solved count
    let solvedCount = 0;
    let submissions: any[] = [];
    try {
      const subs = await fetchCF<any[]>('user.status', {
        handle,
        from: '1',
        count: '1000',
      });
      submissions = subs;
      const solvedProblems = new Set<string>();
      subs.forEach((sub: any) => {
        if (sub.verdict === 'OK' && sub.problem) {
          solvedProblems.add(`${sub.problem.contestId}-${sub.problem.index}`);
        }
      });
      solvedCount = solvedProblems.size;
    } catch {
      // ignore
    }

    // Fetch user rating history
    let contestCount = 0;
    let ratingChanges: any[] = [];
    try {
      ratingChanges = await fetchCF<any[]>('user.rating', { handle });
      contestCount = ratingChanges.length;
    } catch {
      // ignore
    }

    const cls = memoryStore.classes.find((c) => c.id === data.classId) || memoryStore.classes[0];
    const newStudentId = `student-${Date.now()}`;

    const newStudent: StudentData = {
      id: newStudentId,
      name: data.name.trim(),
      codeforcesHandle: cfUser.handle,
      classId: cls.id,
      className: cls.name,
      group: data.group || 'Student',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        id: `stats-${newStudentId}`,
        studentId: newStudentId,
        rating: cfUser.rating || 0,
        rank: cfUser.rank || 'unrated',
        maxRating: cfUser.maxRating || 0,
        maxRank: cfUser.maxRank || 'unrated',
        solvedCount,
        contestCount,
        avatar: cfUser.titlePhoto || cfUser.avatar || 'https://userpic.codeforces.org/no-avatar.jpg',
          lastOnlineTimeSeconds: cfUser.lastOnlineTimeSeconds || 0,
        lastSyncedAt: new Date().toISOString(),
      },
      submissions: submissions.slice(0, 50).map((s) => ({
        id: String(s.id),
        problemId: `${s.problem?.contestId}${s.problem?.index}`,
        problemName: s.problem?.name || 'Problem',
        contestId: s.problem?.contestId,
        index: s.problem?.index,
        rating: s.problem?.rating,
        tags: s.problem?.tags ? JSON.stringify(s.problem.tags) : '[]',
        verdict: s.verdict,
        passededTestCount: s.passedTestCount,
        timeConsumedMillis: s.timeConsumedMillis,
        memoryConsumedBytes: s.memoryConsumedBytes,
        submittedAt: new Date((s.creationTimeSeconds || 0) * 1000).toISOString(),
      })),
      contestParticipations: ratingChanges.map((r) => ({
        id: `cp-${r.contestId}-${newStudentId}`,
        contestId: r.contestId,
        contest: {
          id: r.contestId,
          name: r.contestName,
          startTime: new Date((r.ratingUpdateTimeSeconds || 0) * 1000).toISOString(),
        },
        rank: r.rank,
        oldRating: r.oldRating,
        newRating: r.newRating,
      })),
    };

    memoryStore.students.push(newStudent);
    saveStore(memoryStore);

    // Persist permanently to Supabase cloud
    try {
      await supabase.from('students').upsert(
        {
          id: newStudent.id,
          name: newStudent.name,
          codeforces_handle: newStudent.codeforcesHandle,
          class_id: newStudent.classId,
          class_name: newStudent.className,
          group: newStudent.group,
          active: newStudent.active,
          stats: newStudent.stats,
          submissions: newStudent.submissions || [],
          contest_participations: newStudent.contestParticipations || [],
          created_at: newStudent.createdAt,
          updated_at: newStudent.updatedAt,
        },
        { onConflict: 'codeforces_handle' }
      );
    } catch (supaErr) {
      console.warn('[Supabase Upsert] Warning:', supaErr);
    }

    return newStudent;
  },

  async syncStudent(id: string): Promise<StudentData | null> {
    const student = memoryStore.students.find((s) => s.id === id);
    if (!student) return null;

    try {
      const users = await fetchCF<any[]>('user.info', {
        handles: student.codeforcesHandle,
      });
      if (users && users.length > 0) {
        const u = users[0];
        if (student.stats) {
          student.stats.rating = u.rating || 0;
          student.stats.rank = u.rank || 'unrated';
          student.stats.maxRating = u.maxRating || 0;
          student.stats.maxRank = u.maxRank || 'unrated';
          student.stats.avatar = u.titlePhoto || u.avatar || student.stats.avatar;
          student.stats.lastOnlineTimeSeconds = u.lastOnlineTimeSeconds || 0;
          student.stats.lastSyncedAt = new Date().toISOString();
        }
      }

      const subs = await fetchCF<any[]>('user.status', {
        handle: student.codeforcesHandle,
        from: '1',
        count: '1000',
      });
      const solvedProblems = new Set<string>();
      subs.forEach((sub: any) => {
        if (sub.verdict === 'OK' && sub.problem) {
          solvedProblems.add(`${sub.problem.contestId}-${sub.problem.index}`);
        }
      });
      if (student.stats) {
        student.stats.solvedCount = solvedProblems.size;
      }
      student.submissions = subs.slice(0, 50).map((s) => ({
        id: String(s.id),
        problemId: `${s.problem?.contestId}${s.problem?.index}`,
        problemName: s.problem?.name || 'Problem',
        contestId: s.problem?.contestId,
        index: s.problem?.index,
        rating: s.problem?.rating,
        tags: s.problem?.tags ? JSON.stringify(s.problem.tags) : '[]',
        verdict: s.verdict,
        passededTestCount: s.passedTestCount,
        timeConsumedMillis: s.timeConsumedMillis,
        memoryConsumedBytes: s.memoryConsumedBytes,
        submittedAt: new Date((s.creationTimeSeconds || 0) * 1000).toISOString(),
      }));

      saveStore(memoryStore);

      // Update in Supabase
      try {
        await supabase
          .from('students')
          .update({
            stats: student.stats,
            submissions: student.submissions,
            updated_at: new Date().toISOString(),
          })
          .eq('codeforces_handle', student.codeforcesHandle);
      } catch (e) {}
    } catch (err) {
      console.error('Error syncing student:', err);
    }
    return student;
  },

  async getTeacherDashboard(): Promise<any> {
    memoryStore = loadStore();
    // Auto-sync only students who have no cached submissions (first load)
    // Uses a 5s timeout per student to avoid Vercel serverless timeout
    const allStudents = this.getStudents();
    const unsyncedStudents = allStudents.filter(
      (s) => !s.submissions || s.submissions.length === 0
    );
    if (unsyncedStudents.length > 0) {
      const withTimeout = (promise: Promise<any>, ms: number) =>
        Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej('timeout'), ms))]);
      await Promise.all(
        unsyncedStudents.map((s) => withTimeout(this.syncStudent(s.id), 5000).catch(() => null))
      );
    }

    const handle = 'AbubakrJ';
    let rating = 693;
    let rank = 'newbie';
    let maxRating = 693;
    let maxRank = 'newbie';
    let solvedCount = 58;
    let totalContests = 1;
    let avatar = 'https://userpic.codeforces.org/1970880/title/66afacde68a45195.jpg';
    let teacherSubmissions: any[] = [];

    try {
      const users = await fetchCF<any[]>('user.info', { handles: handle });
      if (users && users.length > 0) {
        const u = users[0];
        rating = u.rating || rating;
        rank = u.rank || rank;
        maxRating = u.maxRating || maxRating;
        maxRank = u.maxRank || maxRank;
        avatar = u.titlePhoto || u.avatar || avatar;
      }
      const subs = await fetchCF<any[]>('user.status', { handle, from: '1', count: '1000' });
      const solved = new Set<string>();
      subs.forEach((s: any) => {
        if (s.verdict === 'OK' && s.problem) {
          solved.add(`${s.problem.contestId}-${s.problem.index}`);
        }
      });
      solvedCount = solved.size;

      teacherSubmissions = (subs || []).slice(0, 40).map((s: any) => ({
        id: String(s.id),
        studentId: '46427f87-007e-4327-bca3-e9e9b3056a9c',
        studentHandle: 'AbubakrJ',
        studentName: 'Abubakr Juraev',
        cfSubmissionId: s.id,
        contestId: s.contestId || s.problem?.contestId || null,
        problemIndex: s.problem?.index || 'A',
        problemName: s.problem?.name || 'Problem',
        problemRating: s.problem?.rating || null,
        tags: s.problem?.tags || [],
        verdict: s.verdict || 'UNKNOWN',
        language: s.programmingLanguage || 'C++',
        submittedAt: s.creationTimeSeconds
          ? new Date(s.creationTimeSeconds * 1000).toISOString()
          : new Date().toISOString(),
      }));
    } catch {
      // Fallback to defaults
    }

    // Collect submissions from all students
    const allStudentSubs: any[] = [];
    for (const st of memoryStore.students) {
      if (Array.isArray(st.submissions)) {
        // Map to keep only the latest submission per problem for a cleaner activity feed
        const latestPerProblem = new Map<string, any>();
        for (const s of st.submissions) {
          const pKey = `${s.contestId}-${s.index || s.problemIndex || 'A'}`;
          let parsedTags = [];
          try {
            parsedTags = typeof s.tags === 'string' ? JSON.parse(s.tags) : (Array.isArray(s.tags) ? s.tags : []);
          } catch (e) { }

          const current = latestPerProblem.get(pKey);
          const submittedAt = s.submittedAt || new Date().toISOString();
          
          if (!current || new Date(current.submittedAt).getTime() < new Date(submittedAt).getTime()) {
            latestPerProblem.set(pKey, {
              id: String(s.id || s.cfSubmissionId),
              studentId: st.id,
              studentHandle: st.codeforcesHandle,
              studentName: st.name,
              cfSubmissionId: s.cfSubmissionId || s.id,
              contestId: s.contestId,
              problemIndex: s.index || s.problemIndex || 'A',
              problemName: s.problemName || 'Problem',
              problemRating: s.rating || s.problemRating || null,
              tags: parsedTags,
              verdict: s.verdict || 'OK',
              language: s.language || 'C++',
              submittedAt: submittedAt,
            });
          }
        }
        allStudentSubs.push(...Array.from(latestPerProblem.values()));
      }
    }

    const recentActivity = [...allStudentSubs]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 50);

    const analytics = this.getAnalytics();
    const leaderboard = this.getLeaderboard();
    const upcomingContests = await this.getUpcomingContests();

    const now = Math.floor(Date.now() / 1000);
    const liveStudents = memoryStore.students
      .filter((s) => s.active && s.stats?.lastOnlineTimeSeconds)
      .map((s) => {
        const recentSub = recentActivity.find(sub => sub.studentId === s.id);
        return {
          studentId: s.id,
          name: s.name,
          handle: s.codeforcesHandle,
          avatar: s.stats?.avatar,
          lastOnlineTimeSeconds: s.stats?.lastOnlineTimeSeconds,
          currentProblem: recentSub ? `${recentSub.problemIndex}. ${recentSub.problemName}` : null,
          currentProblemUrl: recentSub ? (recentSub.contestId ? `https://codeforces.com/contest/${recentSub.contestId}/problem/${recentSub.problemIndex}` : `https://codeforces.com/problemset/problem/${recentSub.contestId}/${recentSub.problemIndex}`) : null,
          isSolving: recentSub ? (recentSub.verdict !== 'OK') : false,
        };
      })
      .sort((a, b) => (b.lastOnlineTimeSeconds || 0) - (a.lastOnlineTimeSeconds || 0))
      .slice(0, 8);

    const classSummary = {
      ...analytics,
      recentActivity,
      mostImprovedStudents: leaderboard.slice(0, 5).map((l: any) => ({
        studentId: l.studentId,
        name: l.name,
        handle: l.handle,
        ratingChange: l.recentRatingChange || 0,
        currentRating: l.rating,
      })),
      liveStudents,
    };

    return {
      teacher: {
        name: 'Abubakr Juraev',
        email: 'teacher@classroom.cf',
        handle: 'AbubakrJ',
        rating,
        rank,
        maxRating,
        maxRank,
        totalSolved: solvedCount,
        totalContests,
        avatar,
        ratingHistory: [],
        recentSubmissions: teacherSubmissions,
        tagStats: {},
        acmp: {
          id: '515125',
          name: 'Джураев Абубакр',
          rating: 984,
          rank: '25494 / 310311',
          solvedCount: 79,
          unsolvedCount: 5,
          url: 'https://acmp.ru/index.asp?main=user&id=515125',
          course: 'Язык программирования C++ (29%)',
        },
      },
      classroom: {
        id: 'class-algorithms-2026',
        name: 'Algorithms & Competitive Programming 2026',
        description: 'Official competitive programming and algorithms training batch led by Abubakr Juraev.',
        totalStudents: memoryStore.students.length,
        activeStudents: memoryStore.students.filter((s) => s.active).length,
      },
      classSummary,
      leaderboard,
      upcomingContests,
    };
  },

  getLeaderboard(classId?: string): any[] {
    const students = this.getStudents(classId).filter((s) => s.active);
    const sorted = [...students].sort(
      (a, b) => (b.stats?.rating || 0) - (a.stats?.rating || 0)
    );
    return sorted.map((s, idx) => ({
      rank: idx + 1,
      studentId: s.id,
      name: s.name,
      handle: s.codeforcesHandle,
      avatar: s.stats?.avatar || 'https://userpic.codeforces.org/no-avatar.jpg',
      rating: s.stats?.rating || 0,
      rankTitle: s.stats?.rank || 'unrated',
      solvedCount: s.stats?.solvedCount || 0,
      recentRatingChange: 0,
    }));
  },

  getAnalytics(classId?: string): any {
    const students = this.getStudents(classId);
    const active = students.filter((s) => s.active);
    const ratings = active.map((s) => s.stats?.rating || 0).filter((r) => r > 0);
    const totalSolved = active.reduce((acc, s) => acc + (s.stats?.solvedCount || 0), 0);

    const avgRating =
      ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
    const sortedRatings = [...ratings].sort((a, b) => a - b);
    const medianRating =
      sortedRatings.length > 0
        ? sortedRatings[Math.floor(sortedRatings.length / 2)]
        : 0;

    const ratingDistribution = [
      { range: 'Newbie', count: ratings.filter(r => r < 1200).length },
      { range: 'Pupil', count: ratings.filter(r => r >= 1200 && r < 1400).length },
      { range: 'Specialist', count: ratings.filter(r => r >= 1400 && r < 1600).length },
      { range: 'Expert', count: ratings.filter(r => r >= 1600 && r < 1900).length },
      { range: 'Cand. Master', count: ratings.filter(r => r >= 1900 && r < 2100).length },
      { range: 'Master+', count: ratings.filter(r => r >= 2100).length },
    ];

    const tagStats: Record<string, { attempted: number; solved: number }> = {};
    const problemStats: Record<string, { name: string; url: string; fails: number; solves: number; rating: number }> = {};

    const allStudentSubs: any[] = [];
    for (const st of active) {
      if (Array.isArray(st.submissions)) {
        for (const s of st.submissions) {
          let tags = [];
          try {
            tags = typeof s.tags === 'string' ? JSON.parse(s.tags) : (Array.isArray(s.tags) ? s.tags : []);
          } catch(e) {}
          const verdict = s.verdict || 'OK';
          const pKey = `${s.contestId}-${s.index || s.problemIndex || 'A'}`;

          if (!problemStats[pKey]) {
            problemStats[pKey] = {
              name: s.problemName || 'Problem',
              url: s.contestId ? `https://codeforces.com/contest/${s.contestId}/problem/${s.index || s.problemIndex || 'A'}` : '#',
              fails: 0,
              solves: 0,
              rating: s.rating || s.problemRating || 0
            };
          }

          if (verdict === 'OK') {
            problemStats[pKey].solves += 1;
            tags.forEach((tag: string) => {
              if (!tagStats[tag]) tagStats[tag] = { attempted: 0, solved: 0 };
              tagStats[tag].solved += 1;
              tagStats[tag].attempted += 1;
            });
          } else {
            problemStats[pKey].fails += 1;
            tags.forEach((tag: string) => {
              if (!tagStats[tag]) tagStats[tag] = { attempted: 0, solved: 0 };
              tagStats[tag].attempted += 1;
            });
          }

          allStudentSubs.push({
            id: String(s.id || s.cfSubmissionId),
            studentId: st.id,
            studentHandle: st.codeforcesHandle,
            studentName: st.name,
            cfSubmissionId: s.cfSubmissionId || s.id,
            contestId: s.contestId,
            problemIndex: s.index || s.problemIndex || 'A',
            problemName: s.problemName || 'Problem',
            problemRating: s.rating || s.problemRating || null,
            tags: tags,
            verdict: verdict,
            language: s.language || 'C++',
            submittedAt: s.submittedAt || new Date().toISOString(),
          });
        }
      }
    }

    const topicInsights = Object.entries(tagStats)
      .map(([tag, stats]) => ({
        topic: tag,
        successRate: stats.attempted > 0 ? Math.round((stats.solved / stats.attempted) * 100) : 0,
        totalAttempts: stats.attempted
      }))
      .filter(t => t.totalAttempts > 2)
      .sort((a, b) => a.successRate - b.successRate);

    const weakTopics = topicInsights.slice(0, 5);

    const recommendedProblems = Object.values(problemStats)
      .filter(p => p.fails > 0 && p.solves < p.fails)
      .sort((a, b) => (b.fails - b.solves) - (a.fails - a.solves))
      .slice(0, 5);

    const recentActivity = allStudentSubs
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 50);

    const sortedActive = [...active].sort(
      (a, b) => (b.stats?.rating || 0) - (a.stats?.rating || 0)
    );
    const mostImprovedStudents = sortedActive.slice(0, 5).map((s) => ({
        studentId: s.id,
        name: s.name,
        handle: s.codeforcesHandle,
        ratingChange: 0,
        currentRating: s.stats?.rating || 0,
    }));

    return {
      totalStudents: students.length,
      activeStudents: active.length,
      averageRating: avgRating,
      medianRating,
      highestRating: ratings.length > 0 ? Math.max(...ratings) : 0,
      lowestRating: ratings.length > 0 ? Math.min(...ratings) : 0,
      totalSolvedProblems: totalSolved,
      averageSolvedProblems: active.length > 0 ? Math.round(totalSolved / active.length) : 0,
      totalContestsParticipated: active.reduce((acc, s) => acc + (s.stats?.contestCount || 0), 0),
      ratingDistribution,
      topicStrengths: topicInsights,
        weakTopics,
        recommendedProblems,
      recentActivity,
      mostImprovedStudents,
    };
  },

  async getUpcomingContests(): Promise<any[]> {
    try {
      const all = await fetchCF<any[]>('contest.list', { gym: 'false' });
      return (all || [])
        .filter((c: any) => c.phase === 'BEFORE' || c.phase === 'CODING')
        .sort((a: any, b: any) => a.startTimeSeconds - b.startTimeSeconds)
        .slice(0, 10)
        .map((c: any) => ({
          id: String(c.id),
          codeforcesContestId: c.id,
          name: c.name,
          type: c.type,
          phase: c.phase,
          durationSeconds: c.durationSeconds,
          startTime: new Date(c.startTimeSeconds * 1000).toISOString(),
          relativeTimeSeconds: c.relativeTimeSeconds,
        }));
    } catch {
      return [];
    }
  },

  async getPastContests(limit: number = 40): Promise<any[]> {
    try {
      const all = await fetchCF<any[]>('contest.list', { gym: 'false' });
      return (all || [])
        .filter((c: any) => c.phase === 'FINISHED')
        .sort((a: any, b: any) => b.startTimeSeconds - a.startTimeSeconds)
        .slice(0, limit)
        .map((c: any) => ({
          id: String(c.id),
          codeforcesContestId: c.id,
          name: c.name,
          type: c.type,
          phase: c.phase,
          durationSeconds: c.durationSeconds,
          startTime: new Date(c.startTimeSeconds * 1000).toISOString(),
          relativeTimeSeconds: c.relativeTimeSeconds,
        }));
    } catch {
      return [];
    }
  },
};
