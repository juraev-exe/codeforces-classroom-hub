import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { teacherService } from './modules/teacher/teacher.service.js';
import { studentsService } from './modules/students/students.service.js';
import { classesService } from './modules/classes/classes.service.js';
import { contestsService } from './modules/contests/contests.service.js';
import { syncService } from './modules/sync/sync.service.js';
import { authService } from './modules/auth/auth.service.js';
import { requireAuth, optionalAuth, AuthenticatedRequest } from './modules/auth/auth.middleware.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Codeforces Classroom Hub API',
  });
});

// ==========================================
// Authentication Endpoints
// ==========================================

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Login failed.' });
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    const user = await authService.getCurrentUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user profile.' });
  }
});

// ==========================================
// Teacher & Dashboard Endpoints
// ==========================================

app.get('/api/me', async (req: Request, res: Response) => {
  try {
    const data = await teacherService.getDashboardData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch dashboard data' });
  }
});

app.get('/api/teacher/dashboard', async (req: Request, res: Response) => {
  try {
    const data = await teacherService.getDashboardData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch teacher dashboard' });
  }
});

// ==========================================
// Students Endpoints
// ==========================================

app.get('/api/students', async (req: Request, res: Response) => {
  try {
    const classId = req.query.classId as string | undefined;
    const active = req.query.active !== undefined ? req.query.active === 'true' : undefined;
    const search = req.query.search as string | undefined;

    const students = await studentsService.getStudents({
      classId,
      active,
      search,
    });
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch students' });
  }
});

app.post('/api/students', async (req: Request, res: Response) => {
  try {
    const { name, codeforcesHandle, classId, group } = req.body;
    if (!name || !codeforcesHandle || !classId) {
      return res.status(400).json({
        error: 'Missing required fields: name, codeforcesHandle, and classId are required.',
      });
    }

    const student = await studentsService.addStudent({
      name,
      codeforcesHandle,
      classId,
      group,
    });
    res.status(201).json(student);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to add student' });
  }
});

app.get('/api/students/:id', async (req: Request, res: Response) => {
  try {
    const student = await studentsService.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch student details' });
  }
});

app.patch('/api/students/:id', async (req: Request, res: Response) => {
  try {
    const updated = await studentsService.updateStudent(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update student' });
  }
});

app.delete('/api/students/:id', async (req: Request, res: Response) => {
  try {
    await studentsService.deleteStudent(req.params.id);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete student' });
  }
});

app.post('/api/students/:id/sync', async (req: Request, res: Response) => {
  try {
    const success = await syncService.syncStudent(req.params.id);
    if (!success) {
      return res.status(400).json({ error: 'Failed to sync student data from Codeforces' });
    }
    const student = await studentsService.getStudentById(req.params.id);
    res.json({ success: true, student });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error executing sync' });
  }
});

// ==========================================
// Classes Endpoints
// ==========================================

app.get('/api/classes', async (req: Request, res: Response) => {
  try {
    const classes = await classesService.getClasses();
    res.json(classes);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch classes' });
  }
});

app.post('/api/classes', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }
    const created = await classesService.createClass(name, description);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create class' });
  }
});

app.get('/api/classes/:id', async (req: Request, res: Response) => {
  try {
    const classroom = await classesService.getClassById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(classroom);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch class' });
  }
});

app.get('/api/classes/:id/analytics', async (req: Request, res: Response) => {
  try {
    const analytics = await classesService.getClassAnalytics(req.params.id);
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch class analytics' });
  }
});

app.get('/api/classes/:id/leaderboard', async (req: Request, res: Response) => {
  try {
    const leaderboard = await classesService.getLeaderboard(req.params.id);
    res.json(leaderboard);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch class leaderboard' });
  }
});

// Global Leaderboard and Analytics
app.get('/api/leaderboard', async (req: Request, res: Response) => {
  try {
    const leaderboard = await classesService.getLeaderboard();
    res.json(leaderboard);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch leaderboard' });
  }
});

app.get('/api/analytics', async (req: Request, res: Response) => {
  try {
    const analytics = await classesService.getClassAnalytics();
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch analytics' });
  }
});

// ==========================================
// Contests Endpoints
// ==========================================

app.get('/api/contests', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const contests = await contestsService.getAllContests(limit);
    res.json(contests);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch contests' });
  }
});

app.get('/api/contests/upcoming', async (req: Request, res: Response) => {
  try {
    const upcoming = await contestsService.getUpcomingContests();
    res.json(upcoming);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch upcoming contests' });
  }
});

// ==========================================
// Sync Endpoints
// ==========================================

app.post('/api/sync/students', async (req: Request, res: Response) => {
  try {
    const result = await syncService.syncAllStudents();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sync students' });
  }
});

app.post('/api/sync/contests', async (req: Request, res: Response) => {
  try {
    const count = await syncService.syncContests();
    res.json({ success: true, count, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sync contests' });
  }
});

// Start background cron jobs and server
syncService.initCronJobs();

app.listen(port, () => {
  console.log(`🚀 Codeforces Classroom Hub API server running on http://localhost:${port}`);
});

export default app;
