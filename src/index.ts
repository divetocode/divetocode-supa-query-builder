// 브라우저용 클라이언트 (ANON 키만 사용)
export class SupabaseClient {
  constructor(
    private url: string,
    private apiKey: string, // ANON 키만 사용
    private options: any = {}
  ) {}

  from(table: string) {
    return new SupabaseQueryBuilder(
      table,
      this.url,
      this.apiKey,
      this.apiKey, // authKey도 apiKey 사용
      this.options
    );
  }

  // RLS 정책 조회 (읽기 전용)
  rls(table: string) {
    return new SupabaseRLSReader(
      table,
      this.url,
      this.apiKey,
      this.options
    );
  }
}

// 서버용 클라이언트 (SERVICE_ROLE 키 사용)
export class SupabaseServer {
  constructor(
    private url: string,
    private apiKey: string,    // ANON 키
    private serverKey: string, // SERVICE_ROLE 키
    private options: any = {}
  ) {}

  from(table: string) {
    return new SupabaseQueryBuilder(
      table,
      this.url,
      this.apiKey,
      this.serverKey, // authKey는 serverKey 사용
      this.options
    );
  }

  // RLS 정책 관리 (생성/수정/삭제 가능)
  rls(table: string) {
    return new SupabaseRLSManager(
      table,
      this.url,
      this.apiKey,
      this.serverKey,
      this.options
    );
  }
}

// 브라우저용 RLS 조회만 가능
class SupabaseRLSReader {
  constructor(
    private table: string,
    private url: string,
    private apiKey: string,
    private options: any = {}
  ) {}

  // 테이블 접근 권한 테스트 (실제 데이터 조회 시도)
  async testAccess() {
    try {
      const url = `${this.url}/rest/v1/${this.table}?select=*&limit=0`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'apikey': this.apiKey
        }
      });

      return { 
        data: { 
          canAccess: response.ok, 
          status: response.status,
          message: response.ok ? 'Access granted' : 'Access denied'
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  // RPC 함수 호출을 통한 정책 조회
  async getPolicies() {
    try {
      const response = await this.executeRPC('get_table_policies', { 
        table_name: this.table 
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  private async executeRPC(functionName: string, params: any) {
    try {
      const url = `${this.url}/rest/v1/rpc/${functionName}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'apikey': this.apiKey
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

// 서버용 RLS 정책 관리 (생성/수정/삭제 가능)
class SupabaseRLSManager {
  constructor(
    private table: string,
    private url: string,
    private apiKey: string,
    private serverKey: string,
    private options: any = {}
  ) {}

  // RLS 활성화
  async enableRLS() {
    try {
      const response = await this.executeRPC('enable_rls', { 
        table_name: this.table 
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // RLS 비활성화
  async disableRLS() {
    try {
      const response = await this.executeRPC('disable_rls', { 
        table_name: this.table 
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 정책 생성
  async createPolicy(policyName: string, operation: string, condition: string) {
    try {
      const response = await this.executeRPC('create_rls_policy', {
        table_name: this.table,
        policy_name: policyName,
        operation: operation,
        condition: condition
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 공개 읽기 정책 생성 (is_public = true)
  async createPublicReadPolicy() {
    return this.createPolicy(
      `${this.table}_public_read`, 
      'SELECT', 
      'is_public = true'
    );
  }

  // 전체 공개 정책 생성 (보안 주의!)
  async createOpenPolicy() {
    return this.createPolicy(
      `${this.table}_open_access`, 
      'ALL', 
      'true'
    );
  }

  // 정책 삭제
  async dropPolicy(policyName: string) {
    try {
      const response = await this.executeRPC('drop_rls_policy', {
        table_name: this.table,
        policy_name: policyName
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 정책 목록 조회
  async getPolicies() {
    try {
      const response = await this.executeRPC('get_table_policies', { 
        table_name: this.table 
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // RLS 상태 확인
  async checkRLSStatus() {
    try {
      const response = await this.executeRPC('check_rls_status', { 
        table_name: this.table 
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  private async executeRPC(functionName: string, params: any) {
    try {
      const url = `${this.url}/rest/v1/rpc/${functionName}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serverKey}`, // SERVER_ROLE 키 사용
          'apikey': this.apiKey
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
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
          'Authorization': `Bearer ${this.authKey}`,
          'apikey': this.apiKey
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