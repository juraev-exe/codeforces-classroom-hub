import crypto from 'crypto';
import type {
  CFApiResponse,
  CFUser,
  CFRatingChange,
  CFSubmission,
  CFContest,
} from '@cf-hub/types';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class CodeforcesService {
  private readonly baseUrl = 'https://codeforces.com/api';
  private readonly apiKey?: string;
  private readonly apiSecret?: string;
  private cache = new Map<string, CacheEntry<any>>();

  // Request queue for rate limiting (min 500ms between calls)
  private queue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private minIntervalMs = 600;

  constructor() {
    this.apiKey = process.env.CODEFORCES_API_KEY || undefined;
    this.apiSecret = process.env.CODEFORCES_API_SECRET || undefined;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateApiSig(methodName: string, params: Record<string, string | number>, time: number): string {
    if (!this.apiKey || !this.apiSecret) {
      return '';
    }

    // 6-character random prefix as required by Codeforces API
    const rand = Math.floor(100000 + Math.random() * 900000).toString();

    const fullParams: Record<string, string | number> = {
      ...params,
      apiKey: this.apiKey,
      time,
    };

    const sortedKeys = Object.keys(fullParams).sort();
    const paramString = sortedKeys
      .map((key) => `${key}=${fullParams[key]}`)
      .join('&');

    const toHash = `${rand}/${methodName}?${paramString}#${this.apiSecret}`;
    const hash = crypto.createHash('sha512').update(toHash).digest('hex');

    return `${rand}${hash}`;
  }

  private async rateLimitedFetch<T>(
    methodName: string,
    params: Record<string, string | number> = {},
    ttlMs: number = 0
  ): Promise<T> {
    const cacheKey = `${methodName}:${JSON.stringify(params)}`;

    if (ttlMs > 0) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLast = now - this.lastRequestTime;
          if (timeSinceLast < this.minIntervalMs) {
            await this.sleep(this.minIntervalMs - timeSinceLast);
          }

          const queryParams = new URLSearchParams();
          for (const [key, value] of Object.entries(params)) {
            queryParams.append(key, String(value));
          }

          if (this.apiKey && this.apiSecret) {
            const time = Math.floor(Date.now() / 1000);
            queryParams.append('apiKey', this.apiKey);
            queryParams.append('time', String(time));

            const sig = this.generateApiSig(methodName, params, time);
            queryParams.append('apiSig', sig);
          }

          const url = `${this.baseUrl}/${methodName}?${queryParams.toString()}`;
          this.lastRequestTime = Date.now();

          let retries = 3;
          let delay = 1000;
          let response: Response | null = null;

          while (retries > 0) {
            try {
              response = await fetch(url, {
                headers: {
                  'User-Agent': 'Codeforces-Classroom-Hub/1.0',
                  Accept: 'application/json',
                },
              });

              if (response.status === 429 || response.status === 503) {
                console.warn(`[Codeforces API] Rate limited (${response.status}), retrying in ${delay}ms...`);
                await this.sleep(delay);
                delay *= 2;
                retries--;
                continue;
              }

              break;
            } catch (networkErr) {
              retries--;
              if (retries === 0) throw networkErr;
              await this.sleep(delay);
              delay *= 2;
            }
          }

          if (!response) {
            throw new Error('Codeforces API is unreachable.');
          }

          const json: CFApiResponse<T> = await response.json();

          if (json.status !== 'OK' || json.result === undefined) {
            throw new Error(json.comment || `Codeforces API returned error on ${methodName}`);
          }

          if (ttlMs > 0) {
            this.cache.set(cacheKey, {
              data: json.result,
              expiresAt: Date.now() + ttlMs,
            });
          }

          resolve(json.result);
        } catch (err) {
          reject(err);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      const nextTask = this.queue.shift();
      if (nextTask) {
        try {
          await nextTask();
        } catch (err) {
          console.error('[Codeforces Service Queue Error]', err);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  // ==========================================
  // Public API Methods
  // ==========================================

  /**
   * Retrieves user info for one or multiple handles.
   * Handles can be semicolon-separated.
   */
  async getUserInfo(handles: string[]): Promise<CFUser[]> {
    if (!handles || handles.length === 0) return [];
    const handleString = handles.join(';');
    return this.rateLimitedFetch<CFUser[]>(
      'user.info',
      { handles: handleString },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  /**
   * Validates if a single handle exists on Codeforces.
   */
  async validateHandle(handle: string): Promise<CFUser | null> {
    try {
      const users = await this.getUserInfo([handle.trim()]);
      return users[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves rating change history for a user.
   */
  async getUserRatingHistory(handle: string): Promise<CFRatingChange[]> {
    return this.rateLimitedFetch<CFRatingChange[]>(
      'user.rating',
      { handle: handle.trim() },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  /**
   * Retrieves submissions for a user.
   */
  async getUserSubmissions(
    handle: string,
    from: number = 1,
    count: number = 50
  ): Promise<CFSubmission[]> {
    return this.rateLimitedFetch<CFSubmission[]>(
      'user.status',
      {
        handle: handle.trim(),
        from,
        count,
      },
      3 * 60 * 1000 // 3 minutes cache
    );
  }

  /**
   * Retrieves contest list.
   */
  async getContestList(gym: boolean = false): Promise<CFContest[]> {
    return this.rateLimitedFetch<CFContest[]>(
      'contest.list',
      { gym: gym ? 'true' : 'false' },
      15 * 60 * 1000 // 15 minutes cache
    );
  }

  /**
   * Retrieves contest standings for specified handles.
   */
  async getContestStandings(
    contestId: number,
    handles: string[] = [],
    from: number = 1,
    count: number = 100
  ): Promise<{
    contest: CFContest;
    problems: any[];
    rows: any[];
  }> {
    const params: Record<string, string | number> = {
      contestId,
      from,
      count,
    };
    if (handles.length > 0) {
      params.handles = handles.join(';');
    }
    return this.rateLimitedFetch(
      'contest.standings',
      params,
      5 * 60 * 1000
    );
  }
}

export const codeforcesService = new CodeforcesService();
