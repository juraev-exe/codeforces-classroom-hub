export function getRankColor(rank?: string): string {
  if (!rank) return 'text-zinc-400';
  const r = rank.toLowerCase();
  if (r.includes('legendary') || r.includes('grandmaster')) return 'text-rose-400 font-bold';
  if (r.includes('master')) return 'text-amber-400 font-semibold';
  if (r.includes('candidate')) return 'text-violet-400 font-semibold';
  if (r.includes('expert')) return 'text-blue-400 font-semibold';
  if (r.includes('specialist')) return 'text-cyan-400 font-medium';
  if (r.includes('pupil')) return 'text-emerald-400 font-medium';
  if (r.includes('newbie')) return 'text-zinc-400 font-medium';
  return 'text-zinc-300';
}

export function getRankBadgeClass(rank?: string): string {
  if (!rank) return 'bg-zinc-800/40 text-zinc-400 border-zinc-700/50';
  const r = rank.toLowerCase();
  if (r.includes('legendary') || r.includes('grandmaster'))
    return 'bg-rose-500/10 text-rose-400 border-rose-500/25 shadow-sm shadow-rose-500/10';
  if (r.includes('master'))
    return 'bg-amber-500/10 text-amber-400 border-amber-500/25 shadow-sm shadow-amber-500/10';
  if (r.includes('candidate'))
    return 'bg-violet-500/10 text-violet-400 border-violet-500/25 shadow-sm shadow-violet-500/10';
  if (r.includes('expert'))
    return 'bg-blue-500/10 text-blue-400 border-blue-500/25 shadow-sm shadow-blue-500/10';
  if (r.includes('specialist'))
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25 shadow-sm shadow-cyan-500/10';
  if (r.includes('pupil'))
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-sm shadow-emerald-500/10';
  return 'bg-zinc-800/40 text-zinc-400 border-zinc-700/40';
}

export function getDifficultyBadgeClass(rating?: number): string {
  if (!rating) return 'bg-zinc-800/40 text-zinc-400 border-zinc-700/40';
  if (rating >= 2400) return 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-bold';
  if (rating >= 2100) return 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold';
  if (rating >= 1900) return 'bg-violet-500/15 text-violet-300 border-violet-500/30 font-semibold';
  if (rating >= 1600) return 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-semibold';
  if (rating >= 1400) return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 font-medium';
  if (rating >= 1200) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-medium';
  return 'bg-zinc-800/50 text-zinc-300 border-zinc-700/40 font-medium';
}

export function getVerdictBadge(verdict: string) {
  switch (verdict) {
    case 'OK':
      return {
        label: 'Accepted',
        type: 'ok',
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10 font-semibold',
      };
    case 'WRONG_ANSWER':
      return {
        label: 'Wrong Answer',
        type: 'wa',
        className: 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-medium',
      };
    case 'TIME_LIMIT_EXCEEDED':
      return {
        label: 'Time Limit',
        type: 'tle',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-medium',
      };
    case 'MEMORY_LIMIT_EXCEEDED':
      return {
        label: 'Memory Limit',
        type: 'mle',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-medium',
      };
    case 'COMPILATION_ERROR':
      return {
        label: 'Compile Error',
        type: 'ce',
        className: 'bg-orange-500/15 text-orange-300 border-orange-500/30 font-medium',
      };
    case 'RUNTIME_ERROR':
      return {
        label: 'Runtime Error',
        type: 're',
        className: 'bg-purple-500/15 text-purple-300 border-purple-500/30 font-medium',
      };
    default:
      return {
        label: verdict.replace(/_/g, ' '),
        type: 'other',
        className: 'bg-zinc-800/40 text-zinc-400 border-zinc-700/40',
      };
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
