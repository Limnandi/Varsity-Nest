const PGREST_URL = process.env.PGREST_URL || 'http://localhost:3001';

export class PostgRESTClient {
  private baseUrl: string;

  constructor(baseUrl: string = PGREST_URL) {
    this.baseUrl = baseUrl;
  }

  // Generic GET method
  async get<T>(table: string, options?: {
    select?: string;
    filter?: Record<string, any>;
    order?: string;
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    const url = new URL(`${this.baseUrl}/${table}`);
    
    if (options?.select) {
      url.searchParams.set('select', options.select);
    }
    
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        // Allow passing operator-prefixed values like "gte.2025-01-01"; default to eq.
        if (typeof value === 'string' && /^(eq|lt|lte|gt|gte|like|ilike|neq|is|in|cs|cd|ov|sl|sr)\./.test(value)) {
          url.searchParams.set(key, value);
        } else {
          url.searchParams.set(key, `eq.${value}`);
        }
      });
    }
    
    if (options?.order) {
      url.searchParams.set('order', options.order);
    }
    
    if (options?.limit) {
      url.searchParams.set('limit', options.limit.toString());
    }
    
    if (options?.offset) {
      url.searchParams.set('offset', options.offset.toString());
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`PostgREST error: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Generic POST method
  async post<T>(table: string, data: any, options?: { on_conflict?: string; resolution?: 'merge-duplicates' | 'ignore-duplicates' }): Promise<T> {
    const url = new URL(`${this.baseUrl}/${table}`);
    if (options?.on_conflict) {
      url.searchParams.set('on_conflict', options.on_conflict);
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    if (options?.resolution) {
      headers['Prefer'] += `,resolution=${options.resolution}`;
    }
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`PostgREST error: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result[0];
  }

  // Generic PUT method
  async put<T>(table: string, data: any, filter: Record<string, any>): Promise<T[]> {
    const url = new URL(`${this.baseUrl}/${table}`);
    
    Object.entries(filter).forEach(([key, value]) => {
      if (typeof value === 'string' && /^(eq|lt|lte|gt|gte|like|ilike|neq|is|in|cs|cd|ov|sl|sr)\./.test(value)) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.set(key, `eq.${value}`);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`PostgREST error: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Generic DELETE method
  async delete(table: string, filter: Record<string, any>): Promise<void> {
    const url = new URL(`${this.baseUrl}/${table}`);
    
    Object.entries(filter).forEach(([key, value]) => {
      if (typeof value === 'string' && /^(eq|lt|lte|gt|gte|like|ilike|neq|is|in|cs|cd|ov|sl|sr)\./.test(value)) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.set(key, `eq.${value}`);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`PostgREST error: ${response.statusText}`);
    }
  }

  // Fetch exactly one row (404 if none, 406 if multiple)
  async single<T>(table: string, filter: Record<string, any>, options?: { select?: string }): Promise<T | null> {
    const url = new URL(`${this.baseUrl}/${table}`);
    if (options?.select) {
      url.searchParams.set('select', options.select);
    }
    Object.entries(filter).forEach(([key, value]) => {
      if (typeof value === 'string' && /^(eq|lt|lte|gt|gte|like|ilike|neq|is|in|cs|cd|ov|sl|sr)\./.test(value)) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.set(key, `eq.${value}`);
      }
    });
    url.searchParams.set('limit', '1');
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`PostgREST error: ${response.statusText}`);
    }
    return response.json();
  }

  // Get total count without fetching data
  async count(table: string, filter?: Record<string, any>): Promise<number> {
    const url = new URL(`${this.baseUrl}/${table}`);
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (typeof value === 'string' && /^(eq|lt|lte|gt|gte|like|ilike|neq|is|in|cs|cd|ov|sl|sr)\./.test(value)) {
          url.searchParams.set(key, value);
        } else {
          url.searchParams.set(key, `eq.${value}`);
        }
      });
    }
    url.searchParams.set('select', 'id');
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Range': '0-0',
        'Prefer': 'count=exact'
      }
    });
    if (!response.ok && response.status !== 206 && response.status !== 200) {
      throw new Error(`PostgREST error: ${response.statusText}`);
    }
    const contentRange = response.headers.get('Content-Range');
    if (!contentRange) return 0;
    const total = contentRange.split('/')[1];
    return Number.parseInt(total ?? '0', 10) || 0;
  }

  // Call a stored procedure
  async rpc<T>(functionName: string, args: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}/rpc/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(args)
    });
    if (!response.ok) {
      throw new Error(`PostgREST error: ${response.statusText}`);
    }
    return response.json();
  }
}

// Export singleton instance
export const postgrest = new PostgRESTClient();
