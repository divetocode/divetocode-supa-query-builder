export class SupabaseClient {
  constructor(
    private url: string,
    private apiKey: string,   // <- apikey 헤더에 사용 (보통 ANON)
    private authKey?: string, // <- Authorization Bearer 에 사용 (보통 SERVICE_ROLE)
    private options: any = {}
  ) {}

  from(table: string) {
    return new SupabaseQueryBuilder(
      table,
      this.url,
      this.apiKey,
      this.authKey ?? this.apiKey, // authKey 없으면 apiKey로 대체
      this.options
    );
  }
}

class SupabaseQueryBuilder {
  constructor(
    private table: string,
    private url: string,
    private apiKey: string,   // apikey 헤더
    private authKey: string,  // Authorization Bearer
    private options: any = {}
  ) {}

  select(columns = '*') {
    return new SupabaseSelectBuilder(this.table, this.url, this.apiKey, this.authKey, columns);
  }
  insert(data: any) {
    return new SupabaseInsertBuilder(this.table, this.url, this.apiKey, this.authKey, data);
  }
  update(data: any) {
    return new SupabaseUpdateBuilder(this.table, this.url, this.apiKey, this.authKey, data);
  }
  delete() {
    return new SupabaseDeleteBuilder(this.table, this.url, this.apiKey, this.authKey);
  }
}

class SupabaseSelectBuilder {
  private whereClause = '';
  private orderClause = '';

  constructor(
    private table: string,
    private url: string,
    private apiKey: string,
    private authKey: string,
    private columns: string
  ) {}

  eq(column: string, value: any) {
    this.whereClause = `${column}=eq.${encodeURIComponent(value)}`;
    return this;
  }
  or(query: string) {
    this.whereClause = `or=(${encodeURIComponent(query)})`;
    return this;
  }
  order(column: string, options?: { ascending: boolean }) {
    const direction = options?.ascending === false ? '.desc' : '.asc';
    this.orderClause = `${column}${direction}`;
    return this;
  }

  async then(resolve: (result: { data: any, error: any }) => void) {
    try {
      let url = `${this.url}/rest/v1/${this.table}`;
      const params = new URLSearchParams();

      // '*' 여도 항상 select 파라미터 추가
      params.append('select', this.columns || '*');

      if (this.whereClause) {
        params.append(this.whereClause.split('=')[0], this.whereClause.split('=').slice(1).join('='));
      }
      if (this.orderClause) {
        params.append('order', this.orderClause);
      }
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authKey}`, // SERVICE_ROLE
          'apikey': this.apiKey                      // ANON
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      resolve({ data, error: null });
    } catch (error) {
      resolve({ data: null, error });
    }
  }
}

class SupabaseInsertBuilder {
  private selectColumns = '';
  constructor(
    private table: string,
    private url: string,
    private apiKey: string,
    private authKey: string,
    private data: any
  ) {}

  select(columns = '') { this.selectColumns = columns; return this; }
  single() { return this; }

  async then(resolve: (result: { data: any, error: any }) => void) {
    try {
      let url = `${this.url}/rest/v1/${this.table}`;
      if (this.selectColumns) url += `?select=${this.selectColumns}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authKey}`, // SERVICE_ROLE
          'apikey': this.apiKey,                      // ANON (또는 SERVICE여도 동작)
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(this.data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      resolve({ data: Array.isArray(data) ? data[0] : data, error: null });
    } catch (error) {
      resolve({ data: null, error });
    }
  }
}

class SupabaseUpdateBuilder {
  private whereClause = '';
  private selectColumns = '';
  constructor(
    private table: string,
    private url: string,
    private apiKey: string,
    private authKey: string,
    private data: any
  ) {}

  eq(column: string, value: any) { this.whereClause = `${column}=eq.${encodeURIComponent(value)}`; return this; }
  select(columns = '') { this.selectColumns = columns; return this; }
  single() { return this; }

  async then(resolve: (result: { data: any, error: any }) => void) {
    try {
      let url = `${this.url}/rest/v1/${this.table}`;
      const params = new URLSearchParams();
      if (this.whereClause) params.append(this.whereClause.split('=')[0], this.whereClause.split('=').slice(1).join('='));
      if (this.selectColumns) params.append('select', this.selectColumns);
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authKey}`,
          'apikey': this.apiKey,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(this.data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      resolve({ data: Array.isArray(data) ? data[0] : data, error: null });
    } catch (error) {
      resolve({ data: null, error });
    }
  }
}

class SupabaseDeleteBuilder {
  private whereClause = '';
  constructor(
    private table: string,
    private url: string,
    private apiKey: string,
    private authKey: string
  ) {}

  eq(column: string, value: any) { this.whereClause = `${column}=eq.${encodeURIComponent(value)}`; return this; }

  async then(resolve: (result: { data: any, error: any }) => void) {
    try {
      let url = `${this.url}/rest/v1/${this.table}`;
      if (this.whereClause) url += '?' + this.whereClause;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authKey}`,
          'apikey': this.apiKey
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      resolve({ data: null, error: null });
    } catch (error) {
      resolve({ data: null, error });
    }
  }
}