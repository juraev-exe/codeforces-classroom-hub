export function getRankColor(rank?: string): string {
  if (!rank) return 'text-zinc-400';
  const r = rank.toLowerCase();
  if (r.includes('legendary') || r.includes('grandmaster')) return 'text-red-500 font-bold';
  if (r.includes('master')) return 'text-amber-500 font-medium';
  if (r.includes('candidate')) return 'text-purple-400 font-medium';
  if (r.includes('expert')) return 'text-blue-400 font-medium';
  if (r.includes('specialist')) return 'text-cyan-400';
  if (r.includes('pupil')) return 'text-emerald-400';
  if (r.includes('newbie')) return 'text-zinc-400';
  return 'text-zinc-300';
}

export function getRankBadgeClass(rank?: string): string {
  if (!rank) return 'bg-zinc-800/60 text-zinc-400 border-zinc-700';
  const r = rank.toLowerCase();
  if (r.includes('legendary') || r.includes('grandmaster'))
    return 'bg-red-950/40 text-red-400 border-red-800/50';
  if (r.includes('master'))
    return 'bg-amber-950/40 text-amber-400 border-amber-800/50';
  if (r.includes('candidate'))
    return 'bg-purple-950/40 text-purple-400 border-purple-800/50';
  if (r.includes('expert'))
    return 'bg-blue-950/40 text-blue-400 border-blue-800/50';
  if (r.includes('specialist'))
    return 'bg-cyan-950/40 text-cyan-400 border-cyan-800/50';
  if (r.includes('pupil'))
    return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50';
  return 'bg-zinc-900 text-zinc-400 border-zinc-800';
}

export function getVerdictBadge(verdict: string) {
  switch (verdict) {
    case 'OK':
      return {
        label: 'Accepted',
        className: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60',
      };
    case 'WRONG_ANSWER':
      return {
        label: 'Wrong Answer',
        className: 'bg-rose-950/50 text-rose-400 border-rose-800/60',
      };
    case 'TIME_LIMIT_EXCEEDED':
      return {
        label: 'Time Limit',
        className: 'bg-amber-950/50 text-amber-400 border-amber-800/60',
      };
    case 'MEMORY_LIMIT_EXCEEDED':
      return {
        label: 'Memory Limit',
        className: 'bg-amber-950/50 text-amber-400 border-amber-800/60',
      };
    case 'COMPILATION_ERROR':
      return {
        label: 'Compilation Error',
        className: 'bg-orange-950/50 text-orange-400 border-orange-800/60',
      };
    case 'RUNTIME_ERROR':
      return {
        label: 'Runtime Error',
        className: 'bg-purple-950/50 text-purple-400 border-purple-800/60',
      };
    default:
      return {
        label: verdict.replace(/_/g, ' '),
        className: 'bg-zinc-900 text-zinc-400 border-zinc-800',
      };
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
