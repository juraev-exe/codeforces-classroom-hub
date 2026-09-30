function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL !== undefined && process.env.NEXT_PUBLIC_API_URL !== '') {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // When running in the browser on Vercel or locally, default to same-origin relative URL
  if (typeof window !== 'undefined') {
    return '';
  }
  // In SSR fallback
  return process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3000';
}

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getApiBase();

  // Normalize parameterized routes for serverless compatibility without square brackets
  let normalizedPath = path;
  const syncMatch = path.match(/^\/api\/students\/([^/]+)\/sync$/);
  if (syncMatch) {
    normalizedPath = `/api/students/sync?id=${encodeURIComponent(syncMatch[1])}`;
  } else {
    const studentMatch = path.match(/^\/api\/students\/([^/?]+)$/);
    if (studentMatch && !studentMatch[1].includes('?')) {
      normalizedPath = `/api/students/detail?id=${encodeURIComponent(studentMatch[1])}`;
    }
    const cfUserMatch = path.match(/^\/api\/codeforces\/user\/([^/?]+)$/);
    if (cfUserMatch && !cfUserMatch[1].includes('?')) {
      normalizedPath = `/api/codeforces/user?handle=${encodeURIComponent(cfUserMatch[1])}`;
    }
  }

  const url = `${base}${normalizedPath}`;

  let authHeader: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cf_hub_token');
    if (token) {
      authHeader = { Authorization: `Bearer ${token}` };
    }
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    let errorMsg = `API error: ${res.status}`;
    try {
      const err = await res.json();
      if (err.error) errorMsg = err.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}
