import re

path = 'apps/web/src/app/page.tsx'
with open(path, 'rb') as f:
    content = f.read()

live_students_html = b'''      </div>

        {/* Live Students Status Panel */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/[0.08] space-y-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Live Radar
              </h3>
              <p className="text-[11px] text-zinc-400">Students active today</p>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {(classSummary.liveStudents || []).length > 0 ? (
              (classSummary.liveStudents || []).map((student: any) => (
                <div key={student.studentId} className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                  <div className="relative">
                    <img src={student.avatar ? (student.avatar.startsWith('//') ? `https:${student.avatar}` : student.avatar) : 'https://userpic.codeforces.org/no-avatar.jpg'} alt={student.handle} className="w-9 h-9 rounded-xl object-cover" onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = 'https://userpic.codeforces.org/no-avatar.jpg'; }} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-[#06070a] rounded-full animate-pulse"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">{student.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {Math.max(0, Math.floor((Date.now()/1000 - student.lastOnlineTimeSeconds) / 60))}m ago
                      </span>
                    </div>
                    {student.currentProblem ? (
                      <a href={student.currentProblemUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline truncate block mt-0.5" title={student.currentProblem}>
                        {student.isSolving ? 'Solving: ' : 'Solved: '} {student.currentProblem}
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-500 block mt-0.5">Idle</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500 py-10">
                <Users className="w-8 h-8 opacity-20" />
                <span className="text-xs">No students currently online</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Student Modal */}'''

live_students_html = live_students_html.replace(b'\n', b'\r\n')

target = b'      </div>\r\n\r\n      {/* Add Student Modal */}'
new_content = content.replace(target, live_students_html)

with open(path, 'wb') as f:
    f.write(new_content)

print('Done')
