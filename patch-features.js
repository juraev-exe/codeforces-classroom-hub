const fs = require('fs');

// ============================================
// 1. Add "At-Risk Students" and "Student Consistency" to server-store.ts
// ============================================
const storePath = 'apps/web/src/lib/server-store.ts';
let store = fs.readFileSync(storePath, 'utf-8');

// Find the liveStudents block end and inject atRiskStudents and consistencyData
const liveStudentsEnd = `        .slice(0, 8);
  
      const classSummary = {`;

const atRiskAndConsistency = `        .slice(0, 8);

      // At-Risk Students: haven't submitted in 7+ days
      const now2 = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const atRiskStudents = memoryStore.students
        .filter((s) => s.active)
        .map((s) => {
          const lastSub = (s.submissions || [])
            .map((sub: any) => new Date(sub.submittedAt || 0).getTime())
            .sort((a: number, b: number) => b - a)[0] || 0;
          const daysSinceLastSub = lastSub > 0 ? Math.floor((now2 - lastSub) / (1000 * 60 * 60 * 24)) : 999;
          return {
            studentId: s.id,
            name: s.name,
            handle: s.codeforcesHandle,
            avatar: s.stats?.avatar,
            rating: s.stats?.rating || 0,
            daysSinceLastSubmission: daysSinceLastSub,
            solvedCount: s.stats?.solvedCount || 0,
          };
        })
        .filter(s => s.daysSinceLastSubmission >= 7)
        .sort((a, b) => b.daysSinceLastSubmission - a.daysSinceLastSubmission)
        .slice(0, 5);

      // Student consistency: problems solved per student for comparison
      const studentProgress = memoryStore.students
        .filter((s) => s.active)
        .map((s) => ({
          studentId: s.id,
          name: s.name,
          handle: s.codeforcesHandle,
          solvedCount: s.stats?.solvedCount || 0,
          rating: s.stats?.rating || 0,
          contestCount: s.stats?.contestCount || 0,
        }))
        .sort((a, b) => b.solvedCount - a.solvedCount);

      const classSummary = {`;

store = store.replace(liveStudentsEnd, atRiskAndConsistency);

// Add new fields to classSummary object
store = store.replace(
  '        liveStudents,\n      };',
  '        liveStudents,\n        atRiskStudents,\n        studentProgress,\n      };'
);

fs.writeFileSync(storePath, store, 'utf-8');
console.log('✓ server-store.ts patched');


// ============================================
// 2. Add new dashboard sections to page.tsx
// ============================================
const pagePath = 'apps/web/src/app/page.tsx';
let page = fs.readFileSync(pagePath, 'utf-8');

// Insert new sections after the Live Radar closing </div> and before the Add Student Modal
const modalAnchor = `      {/* Add Student Modal */}`;

const newSections = `      {/* SECTION 3: TEACHER INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* At-Risk Students */}
        <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">At-Risk Students</h3>
              <p className="text-[10px] text-zinc-400">Haven&apos;t submitted in 7+ days</p>
            </div>
          </div>

          <div className="space-y-2">
            {((classSummary as any).atRiskStudents || []).length > 0 ? (
              ((classSummary as any).atRiskStudents || []).map((s: any) => (
                <div key={s.studentId} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={s.avatar ? (s.avatar.startsWith('//') ? \`https:\${s.avatar}\` : s.avatar) : 'https://userpic.codeforces.org/no-avatar.jpg'}
                      alt={s.handle}
                      className="w-7 h-7 rounded-lg object-cover border border-white/10"
                      onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'https://userpic.codeforces.org/no-avatar.jpg'; }}
                    />
                    <div>
                      <span className="text-[11px] font-semibold text-zinc-100 block">{s.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">@{s.handle}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                    {s.daysSinceLastSubmission}d idle
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 text-zinc-500 py-6">
                <CheckCircle2 className="w-6 h-6 opacity-20" />
                <span className="text-[11px]">All students are active!</span>
              </div>
            )}
          </div>
        </div>

        {/* Student Progress Ranking */}
        <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Student Progress</h3>
              <p className="text-[10px] text-zinc-400">Problems solved & contest stats</p>
            </div>
          </div>

          <div className="space-y-2">
            {((classSummary as any).studentProgress || []).slice(0, 6).map((s: any, idx: number) => (
              <div key={s.studentId} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-white/[0.05] text-[10px] font-bold text-zinc-400 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-100 block">{s.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Rating: {s.rating} · {s.contestCount} contests</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {s.solvedCount} solved
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Student Modal */}`;

page = page.replace(modalAnchor, newSections);

fs.writeFileSync(pagePath, page, 'utf-8');
console.log('✓ page.tsx patched');


// ============================================
// 3. Add a proper favicon (SVG) to public/
// ============================================
const publicDir = 'apps/web/public';
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#bg)"/>
  <text x="16" y="22" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="18" fill="white">CF</text>
</svg>`;

fs.writeFileSync(`${publicDir}/favicon.svg`, faviconSvg, 'utf-8');
console.log('✓ favicon.svg created');

// Also update layout.tsx to reference the favicon
const layoutPath = 'apps/web/src/app/layout.tsx';
let layout = fs.readFileSync(layoutPath, 'utf-8');

if (!layout.includes('icons:')) {
  layout = layout.replace(
    "  description: 'Track student problem solving, contest ratings, and Codeforces telemetry in real-time.',",
    `  description: 'Track student problem solving, contest ratings, and Codeforces telemetry in real-time.',
  icons: {
    icon: '/favicon.svg',
  },`
  );
  fs.writeFileSync(layoutPath, layout, 'utf-8');
  console.log('✓ layout.tsx updated with favicon');
}

console.log('\\n✅ All patches applied!');
