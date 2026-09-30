const fs = require('fs');

const path = 'apps/web/src/lib/server-store.ts';
let content = fs.readFileSync(path, 'utf-8');

const target_dashboard = `    const allStudentSubs: any[] = [];
    for (const st of memoryStore.students) {
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

    const recentActivity = [...allStudentSubs, ...teacherSubmissions]`;

const replacement_dashboard = `    const allStudentSubs: any[] = [];
    for (const st of memoryStore.students) {
      if (Array.isArray(st.submissions)) {
        // Map to keep only the latest submission per problem for a cleaner activity feed
        const latestPerProblem = new Map<string, any>();
        for (const s of st.submissions) {
          const pKey = \`\${s.contestId}-\${s.index || s.problemIndex || 'A'}\`;
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

    const recentActivity = [...allStudentSubs]`;

// Normalize endings
const targetNormalized = target_dashboard.replace(/\r\n/g, '\n');
content = content.replace(/\r\n/g, '\n');

if (content.includes(targetNormalized)) {
    content = content.replace(targetNormalized, replacement_dashboard);
    
    // While we are here, we also need to fix tags in getAnalytics() where we do `const tags = Array.isArray(s.tags) ? s.tags : [];`
    // We can replace it with JSON parsing for tags.
    const targetAnalyticsTags = `const tags = Array.isArray(s.tags) ? s.tags : [];`;
    const replaceAnalyticsTags = `let tags = [];
          try {
            tags = typeof s.tags === 'string' ? JSON.parse(s.tags) : (Array.isArray(s.tags) ? s.tags : []);
          } catch(e) {}`;
    content = content.replace(targetAnalyticsTags, replaceAnalyticsTags);
    
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Replaced dashboard activity stream');
} else {
    console.error('Target not found');
}
