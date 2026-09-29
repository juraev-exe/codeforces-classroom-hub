# Codeforces Classroom Hub

## Project Goal

Build a modern web application for a teacher who wants to manage and analyze their own Codeforces profile and their students' Codeforces activity.

The system should have three core parts:

1. Teacher dashboard
2. Student dashboards and class analytics
3. Telegram contest tracker and notification bot

The application should be modular so additional classes, teachers, students, analytics, and integrations can be added later.

---

## Core Features

### 1. Teacher Dashboard

Create a central dashboard showing:

- Teacher Codeforces handle
- Current rating
- Current rank
- Maximum rating
- Maximum rank
- Total solved problems
- Total contests
- Recent submissions
- Rating history chart
- Contest history
- Problem tag statistics
- Recent activity

Include a class overview:

- Number of students
- Average student rating
- Total problems solved by the class
- Total contests participated in
- Class rating distribution
- Most improved students
- Recent student activity

Add a class leaderboard with:

| Rank | Student | Rating | Problems Solved | Rating Change |
|---|---|---:|---:|---:|
| 1 | Student A | 1421 | 184 | +87 |
| 2 | Student B | 1310 | 152 | +42 |
| 3 | Student C | 1187 | 121 | +31 |

Do not hardcode these values. They are examples only.

---

## 2. Student Management

The teacher should be able to add students using their Codeforces handles.

Student record should contain at minimum:

- Internal student ID
- Name
- Codeforces handle
- Class
- Optional group
- Created date
- Active/inactive status

Do not store Codeforces API credentials in student records.

Student profile page should display:

- Name
- Codeforces handle
- Rating
- Rank
- Maximum rating
- Maximum rank
- Problems solved
- Contest participation
- Rating history
- Recent submissions
- Solved problem tags
- Problem difficulty distribution
- Recent activity

The teacher should be able to filter students by:

- Class
- Rating range
- Rank
- Activity
- Problems solved
- Contest participation

---

## 3. Class Analytics

Create analytics for each class.

Show:

- Average rating
- Median rating
- Highest rating
- Lowest rating
- Total solved problems
- Average solved problems per student
- Contest participation rate
- Rating changes over time
- Student activity over time
- Tag distribution

Useful charts:

- Rating distribution
- Rating history
- Problems solved per student
- Problems solved by tag
- Contest participation
- Student improvement over time

The analytics must use real Codeforces data.

---

## 4. Codeforces API Integration

Use the official Codeforces API.

The backend must communicate with Codeforces.

Never expose the API key or API secret to the frontend.

Use environment variables:

```env
CODEFORCES_API_KEY=
CODEFORCES_API_SECRET=
```

Create a dedicated Codeforces service/module.

The service should support the API methods required for:

- User information
- User rating history
- User submissions
- Contest information
- Contest standings
- Problemset information

Implement:

- Request validation
- API error handling
- Rate-limit handling
- Caching where appropriate
- Retry handling for temporary failures
- Logging

Do not make unnecessary repeated requests to Codeforces.

---

## 5. Local Database

Use PostgreSQL.

Suggested tables:

### users

```text
id
name
email
role
created_at
updated_at
```

Roles:

```text
teacher
admin
```

### students

```text
id
name
codeforces_handle
class_id
active
created_at
updated_at
```

### classes

```text
id
name
description
created_at
updated_at
```

### student_stats

Store cached Codeforces statistics where useful.

```text
id
student_id
rating
rank
max_rating
max_rank
solved_count
contest_count
last_synced_at
```

### submissions

```text
id
student_id
contest_id
problem_index
problem_name
problem_rating
verdict
language
submitted_at
```

### contests

```text
id
codeforces_contest_id
name
phase
start_time
duration_seconds
last_synced_at
```

### contest_participation

```text
id
contest_id
student_id
rank
rating_before
rating_after
rating_change
problems_solved
```

Add indexes for Codeforces handles, contest IDs, student IDs, and timestamps.

---

# 6. Data Synchronization

Implement background synchronization.

The system should periodically update:

- Student profiles
- Rating history
- Submissions
- Upcoming contests
- Contest results

Avoid constantly querying the Codeforces API.

Example synchronization strategy:

```text
Student profile:
Every 30-60 minutes

Submissions:
Every 10-30 minutes for active students

Upcoming contests:
Every 15-30 minutes

Contest results:
After contests finish

Historical data:
Manual sync or scheduled low-frequency sync
```

Make synchronization configurable through environment variables.

---

# 7. Contest Tracker

Create a dedicated contest page.

Display:

- Upcoming contests
- Current contests
- Recently finished contests
- Contest name
- Start date/time
- Duration
- Phase
- Number of registered/participating students where available

Example:

```text
UPCOMING CONTEST

Codeforces Round #XXX

Starts:
29 September 2026, 17:35

Duration:
2h 15m

[Set Telegram Reminder]
```

Use the user's configured timezone for display.

Store timestamps in UTC in the database.

---

# 8. Telegram Bot

Create a Telegram bot connected to the same backend.

The bot should support:

```text
/start
/help
/my
/class
/students
/leaderboard
/contests
/next
/rating <handle>
/progress <handle>
/problems <handle>
```

### /my

Show the teacher's Codeforces statistics.

### /class

Show class statistics.

### /students

List students.

### /leaderboard

Show the current class leaderboard.

### /contests

Show upcoming contests.

### /next

Show the next Codeforces contest.

### /rating <handle>

Show a student's Codeforces statistics.

### /progress <handle>

Show rating and activity progress.

### /problems <handle>

Show solved problem statistics and useful recommendations.

---

# 9. Telegram Automatic Notifications

The bot should support scheduled notifications.

### Upcoming contest reminder

Example:

```text
🏆 CODEFORCES CONTEST REMINDER

Codeforces Round #XXX

Starts in 30 minutes.

Duration: 2h 15m

Good luck!
```

### Contest result report

After a contest:

```text
📊 CLASS CONTEST REPORT

Codeforces Round #XXX

Participated: 17/24

Top rating changes:

Student A: +87
Student B: +54
Student C: +31

Problems solved:
Student A: 4
Student B: 3
Student C: 3
```

Do not hardcode example names or numbers.

### Rating change notification

Example:

```text
📈 RATING UPDATE

Student A

Previous rating: 1342
New rating: 1421
Change: +79
```

---

# 10. Telegram Security

Only authorized Telegram users should access teacher/class information.

Implement:

- Telegram user ID authorization
- Admin/teacher permissions
- Environment-based initial admin configuration
- Command authorization
- Rate limiting
- Logging

Never expose API credentials through Telegram messages.

---

# 11. Web UI

Use a modern minimal dark interface.

Design goals:

- Minimal
- Professional
- Fast
- Responsive
- Desktop-first but mobile-friendly
- Dark gray/black base
- Clear data visualization
- Low visual noise
- Good spacing
- Modern cards
- Subtle borders
- Clean typography

Suggested navigation:

```text
Dashboard
Students
Classes
Leaderboard
Contests
Analytics
Telegram
Settings
```

Student page:

```text
Student Profile

[Avatar] Student Name
         @codeforces_handle

Rating       Rank        Max Rating
1421         Specialist  1510

Rating History
[Chart]

Recent Submissions
[Table]

Problem Tags
[Chart]

Contest History
[Table]
```

---

# 12. Recommended Tech Stack

Frontend:

- Next.js
- TypeScript
- Tailwind CSS
- Recharts

Backend:

- Node.js
- TypeScript
- Express or Fastify

Database:

- PostgreSQL

ORM:

- Prisma or Drizzle

Telegram:

- Telegraf or grammY

Infrastructure:

- Docker
- Docker Compose

Optional:

- Redis for caching and background jobs
- BullMQ for synchronization jobs

Use TypeScript across the application where practical.

---

# 13. Project Structure

Use a clean monorepo structure:

```text
codeforces-classroom/
│
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
│   │
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── codeforces/
│   │   │   │   ├── students/
│   │   │   │   ├── classes/
│   │   │   │   ├── contests/
│   │   │   │   ├── analytics/
│   │   │   │   └── sync/
│   │   │   └── server.ts
│   │
│   └── bot/
│       ├── src/
│       │   ├── commands/
│       │   ├── handlers/
│       │   ├── services/
│       │   └── bot.ts
│
├── packages/
│   ├── database/
│   ├── types/
│   └── config/
│
├── docker/
├── docker-compose.yml
├── .env.example
├── package.json
└── README.md
```

Adapt the structure if the chosen framework requires a better organization.

---

# 14. Environment Variables

Create `.env.example`.

```env
NODE_ENV=development

DATABASE_URL=

CODEFORCES_API_KEY=
CODEFORCES_API_SECRET=

TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_IDS=

REDIS_URL=

WEB_URL=
API_URL=
```

Never commit `.env`.

Add `.env` to `.gitignore`.

---

# 15. Authentication

The initial MVP can use a simple teacher authentication system.

Recommended:

- Email/password authentication
- Secure password hashing
- HTTP-only session/cookie or secure token authentication
- Role-based access control

Later support:

- Google authentication
- Multiple teachers
- Multiple classes

---

# 16. API Design

Create backend endpoints similar to:

```text
GET /api/me

GET /api/students
POST /api/students
GET /api/students/:id
PATCH /api/students/:id
DELETE /api/students/:id

GET /api/students/:id/stats
GET /api/students/:id/submissions
GET /api/students/:id/contests
GET /api/students/:id/problems

GET /api/classes
POST /api/classes
GET /api/classes/:id
GET /api/classes/:id/students
GET /api/classes/:id/analytics
GET /api/classes/:id/leaderboard

GET /api/contests
GET /api/contests/upcoming
GET /api/contests/:id

POST /api/sync/students
POST /api/sync/contests
```

Protect private endpoints with authentication.

---

# 17. Error Handling

The application must handle:

- Invalid Codeforces handles
- Codeforces API unavailable
- API rate limits
- Invalid API credentials
- Telegram API errors
- Database connection failures
- Missing student data
- Failed synchronization
- Duplicate students
- Duplicate contest records

Show useful user-facing errors.

Log technical details on the backend.

Never expose secrets in logs.

---

# 18. Caching

Use caching to reduce Codeforces API requests.

Cache:

- User information
- Rating history
- Contest information
- Problem information

Use PostgreSQL initially if sufficient.

Add Redis when the application requires higher-frequency synchronization or background jobs.

---

# 19. Testing

Create tests for:

- Codeforces API service
- Student creation
- Duplicate handle validation
- Statistics synchronization
- Contest synchronization
- Leaderboard calculations
- Rating change calculations
- Telegram commands
- Authorization
- API error handling

Add integration tests for the main API flows.

---

# 20. MVP Development Order

Build the application in this order.

### Phase 1: Foundation

- Initialize repository
- Configure TypeScript
- Configure database
- Configure Docker
- Configure environment variables
- Create base application structure

### Phase 2: Codeforces Integration

- Implement Codeforces API client
- Test authentication/signature requirements
- Implement user information
- Implement rating history
- Implement submissions
- Implement contests

### Phase 3: Database

- Create schema
- Create migrations
- Create student records
- Create class records
- Create cached statistics
- Create contest records

### Phase 4: Teacher Dashboard

Build:

- Dashboard
- Students page
- Student profile
- Class leaderboard
- Contest page
- Analytics

### Phase 5: Synchronization

Implement background jobs for:

- Student statistics
- Submissions
- Contests
- Contest results

### Phase 6: Telegram Bot

Implement:

- /start
- /help
- /my
- /class
- /students
- /leaderboard
- /contests
- /next
- /rating
- /progress
- /problems

### Phase 7: Notifications

Implement:

- Contest reminders
- Contest result reports
- Rating change notifications

### Phase 8: Polish

- Responsive UI
- Loading states
- Empty states
- Error states
- Better charts
- Performance optimization
- Security review
- Docker deployment

---

# 21. Important Engineering Rules

1. Never expose Codeforces API secrets in frontend code.

2. Never commit secrets to Git.

3. Validate all user input.

4. Use parameterized database queries or a safe ORM.

5. Add authentication to private endpoints.

6. Add authorization for teacher/admin functionality.

7. Do not trust Telegram usernames for authorization. Use Telegram user IDs.

8. Store timestamps in UTC.

9. Convert timestamps to the user's configured timezone for display.

10. Avoid unnecessary Codeforces API requests.

11. Cache expensive API results.

12. Make synchronization idempotent.

13. Avoid duplicate students and contests.

14. Keep the Codeforces integration isolated from the UI.

15. Keep the Telegram bot isolated from the web application.

16. Use TypeScript types shared between frontend and backend.

17. Write clear error messages.

18. Do not hardcode student information.

19. Do not hardcode API credentials.

20. Build the MVP first. Avoid adding unnecessary features before the core system works.

---

# 22. Future Features

After the MVP works, consider:

- AI-powered student analysis
- Automatic problem recommendations
- Weak-topic detection
- Personalized weekly practice plans
- Assignment system
- Teacher-created problem sets
- Student accounts
- Student progress goals
- Multiple teachers
- Multiple schools
- Parent reports
- PDF reports
- Weekly Telegram reports
- Email reports
- GitHub integration
- Discord integration
- Docker deployment
- Multi-language interface

AI recommendations should be based on actual student performance data and should clearly distinguish generated recommendations from Codeforces-provided data.

---

# 23. Definition of Done

The MVP is complete when:

- I can log into the dashboard.
- I can add a Codeforces student handle.
- The system validates the handle.
- The system retrieves the student's Codeforces profile.
- The student appears in my class.
- The dashboard shows real student statistics.
- The dashboard shows my own Codeforces statistics.
- The class leaderboard works.
- The rating history chart works.
- The submissions page works.
- The contest tracker shows upcoming contests.
- The database stores synchronized data.
- The Telegram bot connects successfully.
- Telegram commands return real data.
- Contest reminders work.
- Secrets remain server-side.
- The entire system can run using Docker Compose.
- The README explains setup and deployment.

---

# Agent Instructions

You are implementing this project as a production-quality MVP.

Before writing large amounts of code:

1. Inspect the repository.
2. Determine whether a project already exists.
3. Preserve useful existing code.
4. Identify the current stack.
5. Create a clear implementation plan.
6. Implement incrementally.
7. Run tests after important changes.
8. Fix errors instead of ignoring them.
9. Keep secrets out of source control.
10. Document setup instructions.

Do not create fake Codeforces data except for explicit UI mockups or tests.

Use real API responses for the working application.

When an API limitation prevents a feature, document the limitation and implement the closest reliable alternative.

Prioritize correctness, security, maintainability, and a clean user experience.
