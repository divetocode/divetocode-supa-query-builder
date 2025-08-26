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

  // 스키마 관리 (테이블 CRUD)
  schema() {
    return new SupabaseSchemaManager(
      this.url,
      this.apiKey,
      this.serverKey,
      this.options
    );
  }
}

// 스키마 관리 클래스 (서버 권한 필요)
class SupabaseSchemaManager {
  constructor(
    private url: string,
    private apiKey: string,
    private serverKey: string,
    private options: any = {}
  ) {}

  // 모든 테이블 목록 조회
  async getTables(schema: string = 'public') {
    try {
      const response = await this.executeRPC('get_tables_info', { 
        target_schema: schema 
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 특정 테이블 정보 조회 (컬럼 정보 포함)
  async getTableInfo(tableName: string, schema: string = 'public') {
    try {
      const response = await this.executeRPC('get_table_info', { 
        table_name: tableName,
        target_schema: schema
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 테이블 생성
  async createTable(tableName: string, columns: TableColumn[], options?: CreateTableOptions) {
    try {
      const response = await this.executeRPC('create_table', {
        table_name: tableName,
        columns: columns,
        schema: options?.schema || 'public',
        enable_rls: options?.enableRLS || false,
        add_created_at: options?.addCreatedAt || true,
        add_updated_at: options?.addUpdatedAt || true
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 테이블 삭제
  async dropTable(tableName: string, schema: string = 'public', cascade: boolean = false) {
    try {
      const response = await this.executeRPC('drop_table', {
        table_name: tableName,
        target_schema: schema,
        cascade: cascade
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 컬럼 추가
  async addColumn(tableName: string, column: TableColumn, schema: string = 'public') {
    try {
      const response = await this.executeRPC('add_column', {
        table_name: tableName,
        column: column,
        target_schema: schema
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 컬럼 수정
  async alterColumn(tableName: string, columnName: string, changes: ColumnChanges, schema: string = 'public') {
    try {
      const response = await this.executeRPC('alter_column', {
        table_name: tableName,
        column_name: columnName,
        changes: changes,
        target_schema: schema
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 컬럼 삭제
  async dropColumn(tableName: string, columnName: string, schema: string = 'public') {
    try {
      const response = await this.executeRPC('drop_column', {
        table_name: tableName,
        column_name: columnName,
        target_schema: schema
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 테이블 이름 변경
  async renameTable(oldName: string, newName: string, schema: string = 'public') {
    try {
      const response = await this.executeRPC('rename_table', {
        old_name: oldName,
        new_name: newName,
        target_schema: schema
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 컬럼 이름 변경
  async renameColumn(tableName: string, oldColumnName: string, newColumnName: string, schema: string = 'public') {
    try {
      const response = await this.executeRPC('rename_column', {
        table_name: tableName,
        old_column_name: oldColumnName,
        new_column_name: newColumnName,
        target_schema: schema
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 인덱스 생성
  async createIndex(tableName: string, indexName: string, columns: string[], options?: IndexOptions) {
    try {
      const response = await this.executeRPC('create_index', {
        table_name: tableName,
        index_name: indexName,
        columns: columns,
        unique: options?.unique || false,
        method: options?.method || 'btree',
        target_schema: options?.schema || 'public'
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 인덱스 삭제
  async dropIndex(indexName: string, schema: string = 'public') {
    try {
      const response = await this.executeRPC('drop_index', {
        index_name: indexName,
        target_schema: schema
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 테이블 복사 (구조만 또는 데이터 포함)
  async copyTable(sourceTable: string, targetTable: string, includeData: boolean = false, schema: string = 'public') {
    try {
      const response = await this.executeRPC('copy_table', {
        source_table: sourceTable,
        target_table: targetTable,
        include_data: includeData,
        target_schema: schema
      });
      return response;
    } catch (error) {
      return { data: null, error };
    }
  }

  // 테이블이 존재하는지 확인
  async tableExists(tableName: string, schema: string = 'public') {
    try {
      const response = await this.executeRPC('table_exists', {
        table_name: tableName,
        target_schema: schema
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

// 타입 정의
export interface TableColumn {
  name: string;
  type: string; // 'text', 'integer', 'boolean', 'timestamp', 'uuid' 등
  nullable?: boolean;
  defaultValue?: any;
  primaryKey?: boolean;
  unique?: boolean;
  references?: {
    table: string;
    column: string;
    onDelete?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT';
    onUpdate?: 'CASCADE' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT';
  };
}

export interface CreateTableOptions {
  schema?: string;
  enableRLS?: boolean;
  addCreatedAt?: boolean;
  addUpdatedAt?: boolean;
}

export interface ColumnChanges {
  type?: string;
  nullable?: boolean;
  defaultValue?: any;
  dropDefault?: boolean;
}

export interface IndexOptions {
  unique?: boolean;
  method?: 'btree' | 'hash' | 'gist' | 'spgist' | 'gin' | 'brin';
  schema?: string;
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