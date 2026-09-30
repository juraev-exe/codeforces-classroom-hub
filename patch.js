const fs = require('fs');

const path = 'apps/web/src/lib/server-store.ts';
let content = fs.readFileSync(path, 'utf-8');

const target = `    const allStudentSubs: any[] = [];
    for (const st of active) {
      if (Array.isArray(st.submissions)) {
        for (const s of st.submissions) {
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
            tags: Array.isArray(s.tags) ? s.tags : [],
            verdict: s.verdict || 'OK',
            language: s.language || 'C++',
            submittedAt: s.submittedAt || new Date().toISOString(),
          });
        }
      }
    }
    const recentActivity = allStudentSubs`;

const analytics_logic = `    const tagStats: Record<string, { attempted: number; solved: number }> = {};
    const problemStats: Record<string, { name: string; url: string; fails: number; solves: number; rating: number }> = {};

    const allStudentSubs: any[] = [];
    for (const st of active) {
      if (Array.isArray(st.submissions)) {
        for (const s of st.submissions) {
          const tags = Array.isArray(s.tags) ? s.tags : [];
          const verdict = s.verdict || 'OK';
          const pKey = \`\${s.contestId}-\${s.index || s.problemIndex || 'A'}\`;

          if (!problemStats[pKey]) {
            problemStats[pKey] = {
              name: s.problemName || 'Problem',
              url: s.contestId ? \`https://codeforces.com/contest/\${s.contestId}/problem/\${s.index || s.problemIndex || 'A'}\` : '#',
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

    const recentActivity = allStudentSubs`;

// Need to match exactly, but line endings might differ (CRLF vs LF)
const targetNormalized = target.replace(/\r\n/g, '\n');
content = content.replace(/\r\n/g, '\n');

if (content.includes(targetNormalized)) {
    content = content.replace(targetNormalized, analytics_logic);
} else {
    console.error("Target not found!");
    process.exit(1);
}

content = content.replace('topicStrengths: [],', 'topicStrengths: topicInsights,\n        weakTopics,\n        recommendedProblems,');

fs.writeFileSync(path, content, 'utf-8');
console.log('Done');
