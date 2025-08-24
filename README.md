# @divetocode/supa-query-builder (Unofficial)

> A tiny **Supabase PostgREST** query builder with **browser/server clients** and **RLS helpers**.  
> **Unofficial** – not affiliated with Supabase.

## Why this?
- **Browser client** uses **Anon Key only** → safe reads/writes under **your RLS policies**.
- **Server client** uses **Service Role** for admin jobs (RLS bypass; server-only).
- **RLS helpers**:
  - **Reader (browser)**: quick “can I read this table?” check.
  - **Manager (server)**: enable/disable RLS, create/drop policies, list/check policies via **RPC**.
- Minimal, chainable API over Supabase **REST (PostgREST)**. No ORM “magic”.

> ⚠️ **Never ship your Service Role key to the browser.**  
> Use `SupabaseServer` only on the server.

---

## Install

```bash
npm i @divetocode/supa-query-builder
# or
pnpm add @divetocode/supa-query-builder
# or
yarn add @divetocode/supa-query-builder
```

---

## Quick Start

### 1) Browser: public or RLS-allowed reads

```ts
import { SupabaseClient } from '@divetocode/supa-query-builder';

const supabaseClient = new SupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!  // used for both apikey & Authorization
);

const { data, error } = await supabaseClient
  .from('TB_Products')                   // ensure the REST path matches your table name (often lowercase)
  .select('*')
  .order('created_at', { ascending: false });

if (error) console.error(error);
console.log(data);
```

> If you always get **empty arrays** in the browser, your **RLS policies are too strict**. See “RLS policy examples” below.

### 2) Server: admin reads/writes (Service Role)

```ts
import { SupabaseServer } from '@divetocode/supa-query-builder';

const supabaseServer = new SupabaseServer(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,   // apikey header
  process.env.SUPABASE_SERVICE_ROLE_KEY!        // Authorization: Bearer ...
);

// SELECT (bypasses RLS)
const { data } = await supabaseServer.from('TB_Products').select('*');

// INSERT
const now = new Date().toISOString();
const { data: inserted } = await supabaseServer
  .from('TB_Products')
  .insert([{ name: 'MacBook Pro', category: 'Electronics', price: 2990000, created_at: now, updated_at: now }])
  .select('*');
```

> In Next.js, use `SupabaseServer` only inside **Route Handlers / server code**.

---

## RLS Helpers

### Browser: quick access test

```ts
const supabaseClient = new SupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
const { data } = await supabaseClient.rls('TB_Products').testAccess();
console.log(data); // { canAccess: boolean, status: number, message: string }
```

> `getPolicies()` from the browser is **not recommended** (policy metadata exposure). Use the server manager instead if needed.

### Server: manage RLS via RPC (requires SQL functions)

```ts
const manager = new SupabaseServer(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).rls('TB_Products');

await manager.enableRLS();
await manager.createOpenPolicy();            // ALL → using: true (careful!)
await manager.createPublicReadPolicy();      // SELECT → using: is_public = true
const { data: policies } = await manager.getPolicies();
await manager.dropPolicy('TB_Products_open_access');
```

> These calls require **Postgres RPC functions** (see next section). Grant **EXECUTE** to `service_role` only.

---

## Required RPC Functions (Server-only)

Create these **unsafe-by-nature** DDL helpers with extreme care.  
Use `SECURITY DEFINER`, **revoke from public/anon/authenticated**, and **grant execute to service_role only**.

```sql
-- Enable/disable RLS ---------------------------------------------------------
create or replace function public.enable_rls(schema_name text, table_name text)
returns void language plpgsql security definer as $$
begin
  execute format('alter table %I.%I enable row level security', schema_name, table_name);
end $$;

create or replace function public.disable_rls(schema_name text, table_name text)
returns void language plpgsql security definer as $$
begin
  execute format('alter table %I.%I disable row level security', schema_name, table_name);
end $$;

-- Create/drop policy ---------------------------------------------------------
create or replace function public.create_rls_policy(
  schema_name text,
  table_name  text,
  policy_name text,
  operation   text,  -- SELECT | INSERT | UPDATE | DELETE | ALL
  condition   text   -- expression for USING ()
)
returns void language plpgsql security definer as $$
declare
  cmd text := case upper(operation)
    when 'ALL' then 'all'
    when 'SELECT' then 'select'
    when 'INSERT' then 'insert'
    when 'UPDATE' then 'update'
    when 'DELETE' then 'delete'
    else 'all'
  end;
begin
  execute format('create policy %I on %I.%I for %s using (%s)',
                 policy_name, schema_name, table_name, cmd, condition);
end $$;

create or replace function public.drop_rls_policy(
  schema_name text, table_name text, policy_name text
)
returns void language plpgsql security definer as $$
begin
  execute format('drop policy if exists %I on %I.%I', policy_name, schema_name, table_name);
end $$;

-- RLS status + list policies --------------------------------------------------
create or replace function public.check_rls_status(schema_name text, table_name text)
returns table(enabled boolean) language sql security definer as $$
  select c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = schema_name and c.relname = table_name
$$;

create or replace function public.get_table_policies(schema_name text, table_name text)
returns table(
  policy_name text,
  command text,
  roles text[],
  using text,
  with_check text
) language sql security definer as $$
  select polname::text,
         case polcmd when 'r' then 'select' when 'a' then 'insert'
                     when 'w' then 'update' when 'd' then 'delete'
                     else polcmd end,
         array(select r.rolname from unnest(polroles) r(oid) join pg_roles pr on pr.oid = r.oid),
         pg_get_expr(polqual, polrelid),
         pg_get_expr(polwithcheck, polrelid)
  from pg_policies
  where schemaname = schema_name and tablename = table_name
  order by polname
$$;

-- Lock down privileges: service_role only
revoke all on function public.enable_rls(text,text) from public, anon, authenticated;
revoke all on function public.disable_rls(text,text) from public, anon, authenticated;
revoke all on function public.create_rls_policy(text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.drop_rls_policy(text,text,text) from public, anon, authenticated;
revoke all on function public.check_rls_status(text,text) from public, anon, authenticated;
revoke all on function public.get_table_policies(text,text) from public, anon, authenticated;

grant execute on function public.enable_rls(text,text) to service_role;
grant execute on function public.disable_rls(text,text) to service_role;
grant execute on function public.create_rls_policy(text,text,text,text,text) to service_role;
grant execute on function public.drop_rls_policy(text,text,text) to service_role;
grant execute on function public.check_rls_status(text,text) to service_role;
grant execute on function public.get_table_policies(text,text) to service_role;
```

> Your current `SupabaseRLSManager` passes only `table` → feel free to extend it to accept `schema` too (default: `public`).

---

## RLS Policy Examples (for browser reads)

### 1) Public read (non-sensitive data)

```sql
alter table public."TB_Products" enable row level security;

drop policy if exists "tb_products_read_all" on public."TB_Products";
create policy "tb_products_read_all"
on public."TB_Products"
for select
to anon, authenticated
using (true);
```

### 2) Public flag (`is_public=true` only)

```sql
alter table public."TB_Products" enable row level security;
alter table public."TB_Products" add column if not exists is_public boolean default false;

drop policy if exists "tb_products_read_public" on public."TB_Products";
create policy "tb_products_read_public"
on public."TB_Products"
for select
to anon, authenticated
using (is_public is true);
```

Browser query:

```ts
const { data } = await supa
  .from('TB_Products')
  .select('*')
  .order('created_at', { ascending: false });
```

---

## API Summary

### Browser — `SupabaseClient`
```ts
new SupabaseClient(url: string, apiKey: string, options?: any)
.from(table: string) -> SupabaseQueryBuilder
.rls(table: string)  -> SupabaseRLSReader
```
- `apiKey`: **Anon Key**
- Uses Anon Key for **both** `apikey` and `Authorization` headers.

### Server — `SupabaseServer`
```ts
new SupabaseServer(url: string, apiKey: string, serverKey: string, options?: any)
.from(table: string) -> SupabaseQueryBuilder
.rls(table: string)  -> SupabaseRLSManager
```
- `serverKey`: **Service Role Key** (server-only)

### Query Builder (common)
```ts
.select(columns?: string = '*')
.eq(column: string, value: any)
.or(expr: string) // PostgREST or=(...)
.order(column: string, opts?: { ascending?: boolean })

.insert(rows: any[]).select(columns?: string).single()
.update(patch: any).eq(...).select(columns?: string).single()
.delete().eq(...)
```
- All methods `await` to `{ data, error }`.

### RLS Reader (browser)
```ts
.testAccess()      // { data: { canAccess, status, message }, error }
.getPolicies()     // not recommended on client (sensitive metadata)
```

### RLS Manager (server; RPC required)
```ts
.enableRLS()
.disableRLS()
.createPolicy(policyName, operation, condition)
.createPublicReadPolicy()   // using: is_public = true
.createOpenPolicy()         // using: true (be careful!)
.dropPolicy(policyName)
.getPolicies()
.checkRLSStatus()
```

---

## Troubleshooting

- **Empty arrays in browser** → RLS blocks your query. Add a policy to allow `select` (e.g., public read or `is_public=true`).
- **Route path / casing** → REST path is often lowercase (e.g., table `TB_Products` may be exposed as `tb_products` depending on how it was created).
- **401/403** → Check which headers are sent:
  - Browser: `Authorization = Anon` → make sure RLS allows it.
  - Server: `Authorization = Service Role` → verify the key.
- **RPC 404/401** → Functions are missing or permissions aren’t granted to `service_role`.

---

## Security Notes

- **Service Role Key is server-only.** Never include it in client bundles.
- RLS-management RPCs are **DDL helpers**. Keep them:
  - `SECURITY DEFINER`  
  - `REVOKE ALL` from public/anon/authenticated  
  - `GRANT EXECUTE` to `service_role` only
- Keep your policies minimal and auditable.

---

## License

MIT © 2025 DiveToCode
