const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;

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
