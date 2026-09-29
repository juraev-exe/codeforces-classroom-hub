# Codeforces Classroom Hub

Modern full-stack web application and Telegram notification bot designed for teachers and competitive programming coaches to track student Codeforces performance, monitor live contest participation, analyze class metrics, and trigger automated reminders.

---

## 🌟 Key Features

1. **Teacher Dashboard**:
   - Live teacher Codeforces handle telemetry (rating, tier, max rating, solved problems, contest counts).
   - Rating history progression charts powered by Recharts.
   - Solved problem tag breakdown and recent submissions stream.
   - Comprehensive class overview with average rating, median, solved ratios, and rating distribution histograms.

2. **Student Management**:
   - Real-time Codeforces handle validation against the official Codeforces API upon student registration.
   - Detailed student profile with rating timeline, difficulty distribution, problem tags, and recent submissions.
   - Filtering by classroom, active/inactive status, and handle search.
   - On-demand and scheduled background synchronization.

3. **Classroom Analytics & Leaderboard**:
   - Automated rank tier distribution (Newbie, Pupil, Specialist, Expert, Candidate Master, Master+).
   - Real-time classroom leaderboard with recent rating delta indicators (+/- changes).
   - Most improved student highlights.

4. **Contest Tracker**:
   - Schedule of upcoming Codeforces rounds with countdowns and direct registration links.
   - Automated timezone conversion into the teacher's local time.

5. **Telegram Bot & Scheduled Alerts**:
   - Interactive bot commands: `/my`, `/class`, `/students`, `/leaderboard`, `/contests`, `/next`, `/rating <handle>`, `/problems <handle>`.
   - Security: Whitelists authorized Telegram User IDs (`TELEGRAM_ADMIN_IDS`).
   - Scheduled automated reminders sent 30 minutes before contests begin.

---

## 🏗️ Architecture & Stack

```text
codeforces-classroom/
├── apps/
│   ├── web/        # Next.js 14, Tailwind CSS, Recharts, Lucide Icons
│   ├── api/        # Node.js, Express, Rate-limited Codeforces API Client, Cron Jobs
│   └── bot/        # Telegram Bot (Telegraf) with user-ID authorization
├── packages/
│   ├── database/   # Prisma ORM supporting SQLite & PostgreSQL
│   └── types/      # Shared TypeScript types & DTOs
├── docker/         # Dockerfiles for containerized deployment
├── docker-compose.yml
├── .env.example
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v20 / v26)
- **npm**: v9+
- *(Optional)* **Docker & Docker Compose** for containerized PostgreSQL deployment

### 2. Environment Setup
Copy the sample environment file:
```bash
cp .env.example .env
```

Key variables in `.env`:
```env
PORT=4000
DATABASE_URL="file:./dev.db" # Default zero-config SQLite for local dev
TEACHER_CF_HANDLE="tourist"  # Set your Codeforces handle
TELEGRAM_BOT_TOKEN=""        # Obtain from @BotFather (optional for web app)
TELEGRAM_ADMIN_IDS=""        # Comma-separated Telegram User IDs allowed to query
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Database
Generate Prisma client and push the schema:
```bash
npm run db:push
npm run db:seed
```

### 5. Start Development Servers

**Run the Backend API & Sync Engine:**
```bash
npm run dev:api
```
*API runs at `http://localhost:4000`*

**Run the Next.js Web Dashboard:**
```bash
npm run dev:web
```
*Dashboard runs at `http://localhost:3000`*

**Run the Telegram Bot (optional):**
```bash
npm run dev:bot
```

---

## 🐳 Docker Deployment

To launch the full stack with PostgreSQL and Redis using Docker Compose:

```bash
docker compose up -d --build
```

---

## 🤖 Telegram Bot Commands

| Command | Description |
|---|---|
| `/my` | View teacher profile and live rating |
| `/class` | Classroom telemetry (average rating, solved count) |
| `/students` | List enrolled students and current ratings |
| `/leaderboard` | Current ranked class leaderboard |
| `/contests` | Upcoming round schedule |
| `/next` | Countdown to the next upcoming contest |
| `/rating <handle>` | Check live rating for any Codeforces handle |
| `/help` | Bot guide and commands overview |

---

## 🔒 Security Best Practices
- Codeforces API keys and secrets are strictly server-side and never exposed to the frontend client.
- Telegram authorization checks raw numeric user IDs (`ctx.from.id`) rather than mutable usernames.
- All student database interactions use parameterized queries via Prisma.
