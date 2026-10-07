import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';
import type {
  Assignment,
  AssignmentProblem,
  AssignmentWithProgress,
  StudentAssignmentProgress,
} from '@cf-hub/types';

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
  age?: number;
  telegramChatId?: number | string;
  telegramUsername?: string;
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
}

export const DEFAULT_SETTINGS: AppSettings = {
  teacherName: 'Abubakr Juraev',
  teacherHandle: 'AbubakrJ',
  teacherTitle: 'Lead Algorithms & CP Coach',
  acmpId: '515125',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramAdminIds: process.env.TELEGRAM_ADMIN_IDS || '',
  contestAlertEnabled: true,
  contestAlertMinutesBefore: 30,
  ratingDigestEnabled: true,
  pollIntervalMinutes: 30,
  cfApiKey: process.env.CODEFORCES_API_KEY || '',
  cfApiSecret: process.env.CODEFORCES_API_SECRET || '',
  lastNotifiedContestIds: [],
};

export interface RegistrationSession {
  step: 'waiting_name' | 'waiting_handle_or_link' | 'waiting_age' | 'waiting_confirmation';
  name?: string;
  codeforcesHandle?: string;
  age?: number;
  cfUser?: any;
  solvedCount?: number;
  classId?: string;
  updatedAt: number;
}

const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: 'assign-dp-drill-1',
    title: 'Dynamic Programming Foundations: 1D & Subsequences',
    description: 'Master core transition state formulation on classic Div. 2 / Div. 3 problems.',
    classId: 'class-olympiad-2026',
    className: 'Olympiad Algorithms 2026',
    problems: [
      {
        id: '706B',
        contestId: 706,
        index: 'B',
        name: 'Interesting drink',
        rating: 1100,
        url: 'https://codeforces.com/problemset/problem/706/B',
      },
      {
        id: '455A',
        contestId: 455,
        index: 'A',
        name: 'Boredom',
        rating: 1500,
        url: 'https://codeforces.com/problemset/problem/455/A',
      },
      {
        id: '189A',
        contestId: 189,
        index: 'A',
        name: 'Cut Ribbon',
        rating: 1300,
        url: 'https://codeforces.com/problemset/problem/189/A',
      },
    ],
    dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'assign-bs-pointers-2',
    title: 'Two Pointers & Binary Search on Answer',
    description: 'Precision binary search conditions and sliding window optimizations.',
    classId: 'class-olympiad-2026',
    className: 'Olympiad Algorithms 2026',
    problems: [
      {
        id: '279B',
        contestId: 279,
        index: 'B',
        name: 'Books',
        rating: 1400,
        url: 'https://codeforces.com/problemset/problem/279/B',
      },
      {
        id: '670D1',
        contestId: 670,
        index: 'D1',
        name: 'Magic Powder - 1',
        rating: 1200,
        url: 'https://codeforces.com/problemset/problem/670/D1',
      },
    ],
    dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
];

interface StoreSchema {
  classes: ClassroomData[];
  students: StudentData[];
  settings?: AppSettings;
  registrationSessions?: Record<string, RegistrationSession>;
  assignments?: Assignment[];
}

function loadStore(): StoreSchema {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed.classes) && Array.isArray(parsed.students)) {
        return {
          classes: parsed.classes,
          students: parsed.students,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          registrationSessions: parsed.registrationSessions || {},
          assignments: Array.isArray(parsed.assignments)
            ? parsed.assignments
            : [...DEFAULT_ASSIGNMENTS],
        };
      }
    }
  } catch (err) {
    console.warn('Could not read persistent store, using initial data:', err);
  }
  return {
    classes: [...INITIAL_CLASSES],
    students: [...INITIAL_STUDENTS],
    settings: { ...DEFAULT_SETTINGS },
    registrationSessions: {},
    assignments: [...DEFAULT_ASSIGNMENTS],
  };
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

export async function sendTelegramNotification(
  text: string,
  customChatId?: string
): Promise<{ success: boolean; error?: string }> {
  const settings = { ...DEFAULT_SETTINGS, ...(memoryStore.settings || {}) };
  const token = process.env.TELEGRAM_BOT_TOKEN || settings.telegramBotToken || '';
  if (!token) {
    return { success: false, error: 'Telegram bot token is not configured' };
  }
  const chatIds = customChatId
    ? [customChatId]
    : (settings.telegramAdminIds || process.env.TELEGRAM_ADMIN_IDS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  if (chatIds.length === 0) {
    return { success: false, error: 'No Telegram recipient chat ID configured' };
  }

  let lastError = '';
  let delivered = 0;

  for (const chatId of chatIds) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          disable_web_page_preview: false,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        lastError = data.description || `HTTP ${res.status}`;
      } else {
        delivered++;
      }
    } catch (e: any) {
      lastError = e.message;
    }
  }

  return delivered > 0
    ? { success: true }
    : { success: false, error: lastError || 'Failed to dispatch Telegram message' };
}

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
            age: row.age ? Number(row.age) : undefined,
            telegramChatId: row.telegram_chat_id || row.telegramChatId || undefined,
            telegramUsername: row.telegram_username || row.telegramUsername || undefined,
            active: row.active ?? true,
            createdAt: row.created_at || row.createdAt || new Date().toISOString(),
            updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
            stats: row.stats || null,
            submissions: row.submissions || [],
            contestParticipations: row.contest_participations || row.contestParticipations || [],
          }));

          memoryStore.students = fetched;
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
    const q = id.toLowerCase();
    return (
      memoryStore.students.find(
        (s) => s.id === id || s.codeforcesHandle.toLowerCase() === q
      ) || null
    );
  },

  async addStudent(data: {
    name: string;
    codeforcesHandle: string;
    classId: string;
    group?: string;
    age?: number;
    telegramChatId?: number | string;
    telegramUsername?: string;
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
      age: data.age,
      telegramChatId: data.telegramChatId,
      telegramUsername: data.telegramUsername,
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
      const supaPayload: any = {
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
      };
      if (newStudent.age !== undefined) {
        supaPayload.age = newStudent.age;
      }
      await supabase.from('students').upsert(supaPayload, { onConflict: 'codeforces_handle' });
    } catch (supaErr) {
      console.warn('[Supabase Upsert] Warning:', supaErr);
    }

    return newStudent;
  },

  async deleteStudent(idOrHandle: string): Promise<boolean> {
    const target = idOrHandle.trim().toLowerCase();
    const existing = memoryStore.students.find(
      (s) => s.id.toLowerCase() === target || s.codeforcesHandle.toLowerCase() === target
    );
    const handle = existing ? existing.codeforcesHandle.toLowerCase() : target;

    // Remove permanently from Supabase cloud database
    let supabaseDeleted = false;
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrHandle);
      let query = supabase.from('students').delete();
      if (isUuid) {
        query = query.or(`codeforces_handle.ilike.${handle},id.eq.${idOrHandle}`);
      } else {
        query = query.ilike('codeforces_handle', handle);
      }
      const { data, error } = await query.select();
      if (!error && data && data.length > 0) {
        supabaseDeleted = true;
      }
    } catch (err) {
      console.warn('[Supabase Delete] Warning:', err);
    }

    // Also remove from in-memory cache and local file
    const initialLen = memoryStore.students.length;
    memoryStore.students = memoryStore.students.filter(
      (s) => s.id.toLowerCase() !== target && s.codeforcesHandle.toLowerCase() !== target
    );
    const memoryDeleted = memoryStore.students.length < initialLen;
    saveStore(memoryStore);

    return supabaseDeleted || memoryDeleted;
  },

  getRegistrationSession(chatId: string | number): RegistrationSession | null {
    const key = String(chatId);
    const session = memoryStore.registrationSessions?.[key];
    if (!session) return null;
    // Expire session after 30 minutes of inactivity
    if (Date.now() - session.updatedAt > 30 * 60 * 1000) {
      if (memoryStore.registrationSessions) {
        delete memoryStore.registrationSessions[key];
        saveStore(memoryStore);
      }
      return null;
    }
    return session;
  },

  setRegistrationSession(chatId: string | number, session: RegistrationSession): void {
    if (!memoryStore.registrationSessions) {
      memoryStore.registrationSessions = {};
    }
    memoryStore.registrationSessions[String(chatId)] = {
      ...session,
      updatedAt: Date.now(),
    };
    saveStore(memoryStore);
  },

  clearRegistrationSession(chatId: string | number): void {
    if (memoryStore.registrationSessions?.[String(chatId)]) {
      delete memoryStore.registrationSessions[String(chatId)];
      saveStore(memoryStore);
    }
  },

  getAssignments(classId?: string): AssignmentWithProgress[] {
    const assignments = memoryStore.assignments || [];
    const filtered = classId ? assignments.filter((a) => a.classId === classId) : assignments;
    const allStudents = memoryStore.students || [];

    return filtered.map((assign) => {
      const classStudents = allStudents.filter(
        (s) => s.active && (!assign.classId || s.classId === assign.classId)
      );

      const studentProgress: StudentAssignmentProgress[] = classStudents.map((st) => {
        const solvedProblemIds = assign.problems
          .filter((prob) => {
            if (!Array.isArray(st.submissions)) return false;
            return st.submissions.some(
              (sub: any) =>
                (sub.problemId === prob.id ||
                  (Number(sub.contestId) === Number(prob.contestId) &&
                    String(sub.index).toUpperCase() === String(prob.index).toUpperCase())) &&
                sub.verdict === 'OK'
            );
          })
          .map((p) => p.id);

        return {
          studentId: st.id,
          studentName: st.name,
          handle: st.codeforcesHandle,
          avatar: st.stats?.avatar,
          solvedCount: solvedProblemIds.length,
          totalCount: assign.problems.length,
          completed: assign.problems.length > 0 && solvedProblemIds.length === assign.problems.length,
          solvedProblemIds,
        };
      });

      const totalRequired = classStudents.length * assign.problems.length;
      const totalSolved = studentProgress.reduce((acc, sp) => acc + sp.solvedCount, 0);
      const completionRate =
        totalRequired > 0 ? Math.round((totalSolved / totalRequired) * 100) : 0;

      return {
        ...assign,
        studentProgress,
        completionRate,
      };
    });
  },

  async addAssignment(data: {
    title: string;
    description?: string;
    classId: string;
    problemInput: string;
    dueDate?: string;
  }): Promise<AssignmentWithProgress> {
    if (!memoryStore.assignments) {
      memoryStore.assignments = [...DEFAULT_ASSIGNMENTS];
    }

    const classroom = memoryStore.classes.find((c) => c.id === data.classId);
    const className = classroom?.name || 'All Students';

    const rawTokens = data.problemInput
      .split(/[\n,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const problems: AssignmentProblem[] = [];

    for (const token of rawTokens) {
      const urlMatch = token.match(/codeforces\.com\/(?:problemset\/problem|contest)\/(\d+)\/(?:problem\/)?([a-zA-Z0-9]+)/i);
      let contestId = 0;
      let index = '';

      if (urlMatch) {
        contestId = parseInt(urlMatch[1], 10);
        index = urlMatch[2].toUpperCase();
      } else {
        const tokenMatch = token.match(/^(\d+)([a-zA-Z0-9]+)$/);
        if (tokenMatch) {
          contestId = parseInt(tokenMatch[1], 10);
          index = tokenMatch[2].toUpperCase();
        }
      }

      if (contestId && index) {
        const probId = `${contestId}${index}`;
        if (!problems.some((p) => p.id === probId)) {
          problems.push({
            id: probId,
            contestId,
            index,
            name: `Problem ${contestId}${index}`,
            url: `https://codeforces.com/problemset/problem/${contestId}/${index}`,
          });
        }
      }
    }

    const newAssignment: Assignment = {
      id: `assign-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: data.title.trim(),
      description: data.description?.trim(),
      classId: data.classId,
      className,
      problems,
      dueDate: data.dueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryStore.assignments.unshift(newAssignment);
    saveStore(memoryStore);

    const [withProgress] = serverStore.getAssignments().filter((a) => a.id === newAssignment.id);
    return withProgress || { ...newAssignment, studentProgress: [], completionRate: 0 };
  },

  deleteAssignment(id: string): boolean {
    if (!memoryStore.assignments) return false;
    const initialLen = memoryStore.assignments.length;
    memoryStore.assignments = memoryStore.assignments.filter((a) => a.id !== id);
    if (memoryStore.assignments.length !== initialLen) {
      saveStore(memoryStore);
      return true;
    }
    return false;
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

      // Fetch contest rating history
      try {
        const ratingChanges = await fetchCF<any[]>('user.rating', {
          handle: student.codeforcesHandle,
        });
        if (Array.isArray(ratingChanges)) {
          student.contestParticipations = ratingChanges.map((rc) => ({
            id: `cp-${rc.contestId}-${student.id}`,
            contestId: rc.contestId,
            contest: {
              id: rc.contestId,
              name: rc.contestName,
              startTime: new Date((rc.ratingUpdateTimeSeconds || 0) * 1000).toISOString(),
            },
            rank: rc.rank,
            oldRating: rc.oldRating,
            newRating: rc.newRating,
            ratingDelta: rc.newRating - rc.oldRating,
            ratingUpdateTime: new Date((rc.ratingUpdateTimeSeconds || 0) * 1000).toISOString(),
          }));
          if (student.stats) {
            student.stats.contestCount = ratingChanges.length;
          }
        }
      } catch (e) {}

      saveStore(memoryStore);

      // Update in Supabase
      try {
        await supabase
          .from('students')
          .update({
            stats: student.stats,
            submissions: student.submissions,
            contest_participations: student.contestParticipations,
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

    const settings = this.getSettings();
    const handle = settings.teacherHandle || 'AbubakrJ';
    const teacherName = settings.teacherName || 'Abubakr Juraev';
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
        studentHandle: handle,
        studentName: teacherName,
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
        name: teacherName,
        email: 'teacher@classroom.cf',
        handle,
        title: settings.teacherTitle || 'Lead Algorithms & CP Coach',
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
          id: settings.acmpId || '515125',
          name: teacherName,
          rating: 984,
          rank: '25494 / 310311',
          solvedCount: 79,
          unsolvedCount: 5,
          url: `https://acmp.ru/index.asp?main=user&id=${settings.acmpId || '515125'}`,
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
      { range: 'Newbie (<1200)', count: ratings.filter((r) => r < 1200).length },
      { range: 'Pupil (1200-1399)', count: ratings.filter((r) => r >= 1200 && r < 1400).length },
      { range: 'Specialist (1400-1599)', count: ratings.filter((r) => r >= 1400 && r < 1600).length },
      { range: 'Expert (1600-1899)', count: ratings.filter((r) => r >= 1600 && r < 1900).length },
      { range: 'Cand. Master (1900-2199)', count: ratings.filter((r) => r >= 1900 && r < 2100).length },
      { range: 'Master+ (2200+)', count: ratings.filter((r) => r >= 2100).length },
    ];

    const tagStats: Record<string, { attempted: number; solved: number; failed: number }> = {};
    const problemStats: Record<
      string,
      { name: string; url: string; fails: number; solves: number; rating: number }
    > = {};

    const verdictCounts: Record<string, number> = {
      OK: 0,
      WRONG_ANSWER: 0,
      TIME_LIMIT_EXCEEDED: 0,
      MEMORY_LIMIT_EXCEEDED: 0,
      RUNTIME_ERROR: 0,
      COMPILATION_ERROR: 0,
      SKIPPED: 0,
      OTHER: 0,
    };

    const difficultyBuckets: Record<string, { count: number; solved: number; failed: number }> = {
      '< 1000': { count: 0, solved: 0, failed: 0 },
      '1000 - 1200': { count: 0, solved: 0, failed: 0 },
      '1200 - 1400': { count: 0, solved: 0, failed: 0 },
      '1400 - 1600': { count: 0, solved: 0, failed: 0 },
      '1600 - 1900': { count: 0, solved: 0, failed: 0 },
      '1900 - 2200': { count: 0, solved: 0, failed: 0 },
      '2200+': { count: 0, solved: 0, failed: 0 },
    };

    const hourlyCounts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyCounts[h] = 0;

    const dailyCounts: Record<string, { count: number; solved: number; failed: number }> = {};
    const languageCounts: Record<string, number> = {};

    let hardestSolved: { name: string; rating: number; solvedBy: string; url: string } | null = null;
    let fastestSolveMs: number | null = null;

    const allStudentSubs: any[] = [];
    const studentStatsMap = new Map<
      string,
      {
        totalSubs: number;
        solvedSubs: number;
        tagCounts: Record<string, number>;
        latestSubDate: string | null;
      }
    >();

    for (const st of active) {
      studentStatsMap.set(st.id, {
        totalSubs: 0,
        solvedSubs: 0,
        tagCounts: {},
        latestSubDate: null,
      });

      if (Array.isArray(st.submissions)) {
        for (const s of st.submissions) {
          let tags: string[] = [];
          try {
            tags =
              typeof s.tags === 'string'
                ? JSON.parse(s.tags)
                : Array.isArray(s.tags)
                ? s.tags
                : [];
          } catch (e) {}

          const verdict = s.verdict || 'OK';
          const pKey = `${s.contestId}-${s.index || s.problemIndex || 'A'}`;
          const pRating = s.rating || s.problemRating || null;
          const probUrl = s.contestId
            ? `https://codeforces.com/contest/${s.contestId}/problem/${s.index || s.problemIndex || 'A'}`
            : '#';

          // Verdict aggregation
          if (verdict in verdictCounts) {
            verdictCounts[verdict]++;
          } else {
            verdictCounts.OTHER++;
          }

          // Difficulty aggregation
          if (pRating) {
            let bKey = '< 1000';
            if (pRating >= 2200) bKey = '2200+';
            else if (pRating >= 1900) bKey = '1900 - 2200';
            else if (pRating >= 1600) bKey = '1600 - 1900';
            else if (pRating >= 1400) bKey = '1400 - 1600';
            else if (pRating >= 1200) bKey = '1200 - 1400';
            else if (pRating >= 1000) bKey = '1000 - 1200';

            difficultyBuckets[bKey].count++;
            if (verdict === 'OK') {
              difficultyBuckets[bKey].solved++;
            } else {
              difficultyBuckets[bKey].failed++;
            }
          }

          // Problem stats
          if (!problemStats[pKey]) {
            problemStats[pKey] = {
              name: s.problemName || 'Problem',
              url: probUrl,
              fails: 0,
              solves: 0,
              rating: pRating || 0,
            };
          }

          if (verdict === 'OK') {
            problemStats[pKey].solves += 1;
            if (pRating && (!hardestSolved || pRating > hardestSolved.rating)) {
              hardestSolved = {
                name: `${s.index || s.problemIndex || 'A'}. ${s.problemName || 'Problem'}`,
                rating: pRating,
                solvedBy: st.name || st.codeforcesHandle,
                url: probUrl,
              };
            }
            if (
              s.timeConsumedMillis &&
              s.timeConsumedMillis > 0 &&
              (!fastestSolveMs || s.timeConsumedMillis < fastestSolveMs)
            ) {
              fastestSolveMs = s.timeConsumedMillis;
            }
            tags.forEach((tag: string) => {
              if (!tagStats[tag]) tagStats[tag] = { attempted: 0, solved: 0, failed: 0 };
              tagStats[tag].solved += 1;
              tagStats[tag].attempted += 1;
            });
          } else {
            problemStats[pKey].fails += 1;
            tags.forEach((tag: string) => {
              if (!tagStats[tag]) tagStats[tag] = { attempted: 0, solved: 0, failed: 0 };
              tagStats[tag].failed += 1;
              tagStats[tag].attempted += 1;
            });
          }

          // Hourly & Daily Activity
          const subDateStr = s.submittedAt || new Date().toISOString();
          try {
            const dateObj = new Date(subDateStr);
            const hour = dateObj.getUTCHours();
            hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;

            const dayKey = dateObj.toISOString().split('T')[0];
            if (!dailyCounts[dayKey]) {
              dailyCounts[dayKey] = { count: 0, solved: 0, failed: 0 };
            }
            dailyCounts[dayKey].count++;
            if (verdict === 'OK') dailyCounts[dayKey].solved++;
            else dailyCounts[dayKey].failed++;
          } catch (e) {}

          // Language counts
          const lang = s.language || 'C++';
          languageCounts[lang] = (languageCounts[lang] || 0) + 1;

          // Student stats mapping
          const stStat = studentStatsMap.get(st.id);
          if (stStat) {
            stStat.totalSubs++;
            if (verdict === 'OK') stStat.solvedSubs++;
            tags.forEach((t) => {
              stStat.tagCounts[t] = (stStat.tagCounts[t] || 0) + 1;
            });
            if (
              !stStat.latestSubDate ||
              new Date(subDateStr).getTime() > new Date(stStat.latestSubDate).getTime()
            ) {
              stStat.latestSubDate = subDateStr;
            }
          }

          allStudentSubs.push({
            id: String(s.id || s.cfSubmissionId),
            studentId: st.id,
            studentHandle: st.codeforcesHandle,
            studentName: st.name,
            studentAvatar: st.stats?.avatar || 'https://userpic.codeforces.org/no-avatar.jpg',
            cfSubmissionId: Number(s.cfSubmissionId || s.id),
            contestId: s.contestId,
            problemIndex: s.index || s.problemIndex || 'A',
            problemName: s.problemName || 'Problem',
            problemRating: pRating,
            tags: tags,
            verdict: verdict,
            language: lang,
            submittedAt: subDateStr,
            timeConsumedMillis: s.timeConsumedMillis,
            memoryConsumedBytes: s.memoryConsumedBytes,
            passedTestCount: s.passedTestCount,
          });
        }
      }
    }

    // Comprehensive Topic Strengths
    const topicStrengths = Object.entries(tagStats)
      .map(([tag, stats]) => {
        const rate =
          stats.attempted > 0 ? Math.round((stats.solved / stats.attempted) * 100) : 0;
        let status: 'mastered' | 'practicing' | 'needs_attention' = 'practicing';
        if (rate >= 70 && stats.solved >= 2) status = 'mastered';
        else if (rate < 45) status = 'needs_attention';

        return {
          topic: tag,
          successRate: rate,
          totalAttempts: stats.attempted,
          solved: stats.solved,
          failed: stats.failed,
          status,
        };
      })
      .sort((a, b) => b.totalAttempts - a.totalAttempts);

    const weakTopics = topicStrengths
      .filter((t) => t.totalAttempts >= 2 && t.successRate < 50)
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 6)
      .map((t) => ({
        topic: t.topic,
        successRate: t.successRate,
        totalAttempts: t.totalAttempts,
      }));

    const recommendedProblems = Object.values(problemStats)
      .filter((p) => p.fails > 0 && p.solves < p.fails)
      .sort((a, b) => b.fails - b.solves - (a.fails - a.solves))
      .slice(0, 6);

    const recentActivity = allStudentSubs
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 250);

    // Compute Rating delta and climber rankings using contest participations
    const climberList = active.map((s) => {
      let ratingDelta = 0;
      if (Array.isArray(s.contestParticipations) && s.contestParticipations.length > 0) {
        const latestCp = s.contestParticipations[s.contestParticipations.length - 1];
        if (latestCp && typeof latestCp.newRating === 'number' && typeof latestCp.oldRating === 'number') {
          ratingDelta = latestCp.newRating - latestCp.oldRating;
        }
      }
      return {
        studentId: s.id,
        name: s.name,
        handle: s.codeforcesHandle,
        ratingChange: ratingDelta,
        currentRating: s.stats?.rating || 0,
        avatar: s.stats?.avatar,
      };
    });

    const mostImprovedStudents = [...climberList]
      .sort((a, b) => b.ratingChange - a.ratingChange)
      .slice(0, 6);

    // Build verdict distribution
    const totalSubsLogged = allStudentSubs.length;
    const verdictColorMap: Record<string, { label: string; color: string }> = {
      OK: { label: 'Accepted', color: '#10b981' },
      WRONG_ANSWER: { label: 'Wrong Answer', color: '#f43f5e' },
      TIME_LIMIT_EXCEEDED: { label: 'Time Limit', color: '#f59e0b' },
      MEMORY_LIMIT_EXCEEDED: { label: 'Memory Limit', color: '#ec4899' },
      RUNTIME_ERROR: { label: 'Runtime Error', color: '#a855f7' },
      COMPILATION_ERROR: { label: 'Compile Error', color: '#ea580c' },
      SKIPPED: { label: 'Skipped', color: '#64748b' },
      OTHER: { label: 'Other', color: '#71717a' },
    };

    const verdictDistribution = Object.entries(verdictCounts)
      .filter(([_, count]) => count > 0)
      .map(([v, count]) => {
        const meta = verdictColorMap[v] || { label: v, color: '#71717a' };
        return {
          verdict: v,
          label: meta.label,
          count,
          percentage: totalSubsLogged > 0 ? Math.round((count / totalSubsLogged) * 100) : 0,
          color: meta.color,
        };
      })
      .sort((a, b) => b.count - a.count);

    // Build Difficulty distribution array
    const difficultyDistribution = Object.entries(difficultyBuckets).map(([range, val]) => ({
      range,
      count: val.count,
      solved: val.solved,
      failed: val.failed,
    }));

    // Build 90-day daily activity array (ensuring contiguous dates for heatmap)
    const dailyActivity: Array<{ date: string; count: number; solved: number; failed: number }> = [];
    const today = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const entry = dailyCounts[dateKey] || { count: 0, solved: 0, failed: 0 };
      dailyActivity.push({
        date: dateKey,
        count: entry.count,
        solved: entry.solved,
        failed: entry.failed,
      });
    }

    // Build Hourly activity
    const hourlyActivity = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${h.toString().padStart(2, '0')}:00`,
      count: hourlyCounts[h] || 0,
    }));

    // Find peak hour
    let peakHour = 0;
    let peakVal = 0;
    hourlyActivity.forEach((ha) => {
      if (ha.count > peakVal) {
        peakVal = ha.count;
        peakHour = ha.hour;
      }
    });
    const peakHourLabel = `${peakHour.toString().padStart(2, '0')}:00 - ${(peakHour + 1)
      .toString()
      .padStart(2, '0')}:00 UTC`;

    // Language distribution
    const languageDistribution = Object.entries(languageCounts)
      .map(([lang, count]) => ({
        language: lang,
        count,
        percentage: totalSubsLogged > 0 ? Math.round((count / totalSubsLogged) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Student comparison
    const studentComparison = active.map((s) => {
      const stData = studentStatsMap.get(s.id);
      const totalS = stData?.totalSubs || 0;
      const solvedS = stData?.solvedSubs || 0;
      const acc = totalS > 0 ? Math.round((solvedS / totalS) * 100) : 0;

      let topTag = 'General';
      if (stData && Object.keys(stData.tagCounts).length > 0) {
        const sortedTags = Object.entries(stData.tagCounts).sort((a, b) => b[1] - a[1]);
        topTag = sortedTags[0][0];
      }

      let ratingDelta = 0;
      if (Array.isArray(s.contestParticipations) && s.contestParticipations.length > 0) {
        const latestCp = s.contestParticipations[s.contestParticipations.length - 1];
        if (latestCp && typeof latestCp.newRating === 'number' && typeof latestCp.oldRating === 'number') {
          ratingDelta = latestCp.newRating - latestCp.oldRating;
        }
      }

      return {
        studentId: s.id,
        name: s.name,
        handle: s.codeforcesHandle,
        avatar: s.stats?.avatar || 'https://userpic.codeforces.org/no-avatar.jpg',
        rating: s.stats?.rating || 0,
        maxRating: s.stats?.maxRating || s.stats?.rating || 0,
        rank: s.stats?.rank || 'unrated',
        solvedCount: s.stats?.solvedCount || solvedS,
        totalSubmissions: totalS,
        accuracyRate: acc,
        recentRatingChange: ratingDelta,
        lastActive: stData?.latestSubDate || null,
        topTag,
      };
    });

    // Multi-student Historical Rating Evolution Trajectory
    const timelineMap = new Map<string, { date: string; timestamp: number; contestName: string; ratings: Record<string, number> }>();
    for (const s of active) {
      if (Array.isArray(s.contestParticipations) && s.contestParticipations.length > 0) {
        for (const cp of s.contestParticipations) {
          const dateStr = cp.contest?.startTime || cp.ratingUpdateTime || new Date().toISOString();
          const timestamp = new Date(dateStr).getTime();
          const shortDate = new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const contestKey = `${cp.contestId || cp.id}-${shortDate}`;

          if (!timelineMap.has(contestKey)) {
            timelineMap.set(contestKey, {
              date: shortDate,
              timestamp,
              contestName: cp.contest?.name || cp.contestName || `Contest #${cp.contestId}`,
              ratings: {},
            });
          }
          timelineMap.get(contestKey)!.ratings[s.codeforcesHandle] = cp.newRating;
        }
      } else if (s.stats?.rating) {
        const shortDate = 'Current';
        const contestKey = `current-${s.id}`;
        if (!timelineMap.has(contestKey)) {
          timelineMap.set(contestKey, {
            date: shortDate,
            timestamp: Date.now(),
            contestName: 'Current Rating',
            ratings: {},
          });
        }
        timelineMap.get(contestKey)!.ratings[s.codeforcesHandle] = s.stats.rating;
      }
    }

    const sortedTimeline = Array.from(timelineMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    const lastRating: Record<string, number> = {};
    const ratingEvolution = sortedTimeline.map((item) => {
      const point: Record<string, any> = {
        date: item.date,
        contestName: item.contestName,
      };
      for (const s of active) {
        if (item.ratings[s.codeforcesHandle] !== undefined) {
          lastRating[s.codeforcesHandle] = item.ratings[s.codeforcesHandle];
        }
        if (lastRating[s.codeforcesHandle] !== undefined) {
          point[s.codeforcesHandle] = lastRating[s.codeforcesHandle];
        }
      }
      return point;
    });

    const COLOR_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];
    const studentCurves = active.map((s, idx) => ({
      handle: s.codeforcesHandle,
      name: s.name,
      rating: s.stats?.rating || 0,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    }));

    const overallAccuracy =
      totalSubsLogged > 0
        ? Math.round(((verdictCounts.OK || 0) / totalSubsLogged) * 100)
        : 0;

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
      verdictDistribution,
      difficultyDistribution,
      dailyActivity,
      hourlyActivity,
      languageDistribution,
      topicStrengths,
      weakTopics,
      recommendedProblems,
      recentActivity,
      mostImprovedStudents,
      studentComparison,
      ratingEvolution,
      studentCurves,
      statsSummary: {
        accuracyRate: overallAccuracy,
        totalSubmissions: totalSubsLogged,
        activeCodersStreak: dailyActivity.filter((d) => d.count > 0).length,
        hardestProblemSolved: hardestSolved,
        fastestSolveTimeMs: fastestSolveMs,
        peakHourLabel,
      },
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

  getSettings(): AppSettings {
    if (!memoryStore.settings) {
      memoryStore.settings = { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...memoryStore.settings };
  },

  updateSettings(partial: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated: AppSettings = { ...current, ...partial };
    memoryStore.settings = updated;
    saveStore(memoryStore);
    return updated;
  },

  getStorageHealth() {
    let fileSize = 0;
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        fileSize = fs.statSync(STORAGE_FILE).size;
      }
    } catch {}

    const totalStudents = memoryStore.students.length;
    const totalClasses = memoryStore.classes.length;
    const totalSubmissions = memoryStore.students.reduce(
      (acc, s) => acc + (s.submissions?.length || 0),
      0
    );

    return {
      storageFile: path.basename(STORAGE_FILE),
      storagePath: STORAGE_FILE,
      fileSizeBytes: fileSize,
      fileSizeFormatted: `${(fileSize / 1024).toFixed(1)} KB`,
      totalStudents,
      totalClasses,
      totalSubmissions,
      supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    };
  },

  async clearCache(): Promise<void> {
    for (const student of memoryStore.students) {
      student.submissions = [];
      student.contestParticipations = [];
    }
    saveStore(memoryStore);
  },

  async checkContestAlerts(): Promise<{ alerted: any[]; skipped: any[] }> {
    const settings = this.getSettings();
    if (!settings.contestAlertEnabled) {
      return { alerted: [], skipped: [] };
    }

    const upcoming = await this.getUpcomingContests();
    const notifiedIds = new Set((settings.lastNotifiedContestIds || []).map(String));
    const minutesThreshold = settings.contestAlertMinutesBefore || 30;

    const alerted: any[] = [];
    const skipped: any[] = [];
    const now = Math.floor(Date.now() / 1000);

    for (const contest of upcoming) {
      const contestId = String(contest.codeforcesContestId || contest.id);
      const startTime = Math.floor(new Date(contest.startTime).getTime() / 1000);
      const minutesRemaining = Math.floor((startTime - now) / 60);

      const durationHours = Math.floor(contest.durationSeconds / 3600);
      const durationMinutes = Math.floor((contest.durationSeconds % 3600) / 60);
      const durationStr = `${durationHours}h ${durationMinutes > 0 ? `${durationMinutes}m` : ''}`.trim();

      const key2h = `${contestId}:2h`;
      const keyUrgent = `${contestId}:urgent`;

      // Tier 1: 2-hour advance reminder (90m - 135m before start)
      if (minutesRemaining >= 90 && minutesRemaining <= 135) {
        if (!notifiedIds.has(key2h)) {
          const message = 
`🏆 *CODEFORCES ADVANCE CONTEST NOTICE* (2h Reminder)

*${contest.name}*

⏰ Starts in: ~${minutesRemaining} minutes (~2 hours)
⏱ Duration: ${durationStr}
🔗 [Contest Registration](https://codeforces.com/contestRegistration/${contestId})

Registration is open! Secure your spot now. 🚀`;

          await sendTelegramNotification(message);
          notifiedIds.add(key2h);
          alerted.push({ contestId, tier: '2h', name: contest.name, minutesRemaining });
        } else {
          skipped.push({ contestId, name: contest.name, reason: 'Already notified for 2h window' });
        }
      } 
      // Tier 2: Urgent final reminder (~30m before start)
      else if (minutesRemaining > 0 && minutesRemaining <= minutesThreshold + 5) {
        if (!notifiedIds.has(keyUrgent) && !notifiedIds.has(contestId)) {
          const message = 
`🚨 *CODEFORCES ROUND STARTING SOON* (Urgent Reminder)

*${contest.name}*

⏰ Starts in: ~${minutesRemaining} minutes
⏱ Duration: ${durationStr}
🔗 [Direct Contest Link](https://codeforces.com/contestRegistration/${contestId})

Warm up your IDE and test environment! Good luck to all students! ⚡`;

          await sendTelegramNotification(message);
          notifiedIds.add(keyUrgent);
          notifiedIds.add(contestId);
          alerted.push({ contestId, tier: 'urgent', name: contest.name, minutesRemaining });
        } else {
          skipped.push({ contestId, name: contest.name, reason: 'Already notified for urgent window' });
        }
      } else {
        skipped.push({ contestId, name: contest.name, reason: `${minutesRemaining}m remaining (outside alert windows)` });
      }
    }

    this.updateSettings({ lastNotifiedContestIds: Array.from(notifiedIds) });
    return { alerted, skipped };
  },
};
