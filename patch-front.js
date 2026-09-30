const fs = require('fs');

const path = 'apps/web/src/app/analytics/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

const target = `      {/* Recent Submissions Feed */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">`;

const insights_html = `      {/* AI Insights: Weaknesses & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topics to Learn */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Topics to Review</h2>
          </div>
          <p className="text-xs text-zinc-400">Algorithm tags where the class has the lowest success rate.</p>

          <div className="space-y-3 pt-2">
            {(summary as any).weakTopics && (summary as any).weakTopics.length > 0 ? (
              (summary as any).weakTopics.map((topic: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white/[0.05] text-[11px] font-bold text-zinc-400 flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">{topic.topic}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-red-500/10 text-red-400 border border-red-500/25 font-mono">
                      {topic.successRate}%
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-1">{topic.totalAttempts} attempts</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-8 text-center">Not enough data yet.</p>
            )}
          </div>
        </div>

        {/* Recommended Questions */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Recommended Practice</h2>
          </div>
          <p className="text-xs text-zinc-400">Most frequently failed problems by the class recently.</p>

          <div className="space-y-3 pt-2">
            {(summary as any).recommendedProblems && (summary as any).recommendedProblems.length > 0 ? (
              (summary as any).recommendedProblems.map((prob: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition">
                  <div className="flex flex-col min-w-0 flex-1 mr-4">
                    <a href={prob.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-400 hover:underline truncate">
                      {prob.name}
                    </a>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-400 font-mono">Rating: {prob.rating || '?'}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/25 font-mono">
                      {prob.fails} fails
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-1">{prob.solves} solves</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-8 text-center">Class is doing perfectly!</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Submissions Feed */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">`;

content = content.replace(target, insights_html);
content = content.replace(target.replace(/\n/g, '\r\n'), insights_html);

content = content.replace('Trophy,\n  ExternalLink,', 'Trophy,\n  ExternalLink,\n  Target,\n  Lightbulb,');

fs.writeFileSync(path, content, 'utf-8');
console.log('Done');
