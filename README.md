# @divetocode/supa-query-builder (Unofficial)

> **Tiny server‑only Supabase PostgREST query builder.**
>
> Not affiliated with Supabase. This package is an **unofficial** REST client / query builder that talks to the Supabase **Data API (PostgREST)** with a minimal chainable API.

---

## TL;DR

* **What**: Light wrapper around `fetch` for Supabase **REST** with a small query‑builder interface.
* **Why**: When you want **full control** of HTTP headers, especially *`apikey` (Anon)* vs *`Authorization` (Service Role)*, with **zero ORM magic**.
* **Where**: **Server‑only** (Next.js Route Handlers, Node.js backends, workers, etc.).

> ⚠️ **Do not use in the browser.** Never ship your `SERVICE_ROLE` key to the client.

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

## Quick start (Node / Next.js server)

```ts
import { SupabaseClient } from "@divetocode/supa-query-builder";

const supa = new SupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,   // sent as `apikey`
  process.env.SUPABASE_SERVICE_ROLE_KEY!        // sent as `Authorization: Bearer ...`
);

// SELECT
const { data: rows, error } = await supa
  .from("TB_Products")
  .select("*")
  .order("created_at", { ascending: false });

if (error) throw error;
console.log(rows);

// INSERT
const now = new Date().toISOString();
const { data: inserted } = await supa
  .from("TB_Products")
  .insert([{ name: "MacBook Pro", category: "전자제품", price: 2990000, created_at: now, updated_at: now }])
  .select("*");

// UPDATE
const { data: updated } = await supa
  .from("TB_Products")
  .update({ price: 2790000, updated_at: new Date().toISOString() })
  .eq("id", 1)
  .select("*");

// DELETE
const { error: delErr } = await supa
  .from("TB_Products")
  .delete()
  .eq("id", 1);
```

---

## What this is / isn’t

**This is**

* A tiny **query builder** over Supabase **PostgREST** (REST Data API).
* A way to **split** headers: `apikey = Anon` **and** `Authorization = Service Role`.
* A minimal chainable API you can `await`.

**This is NOT**

* An ORM. No models, migrations, relations, or change tracking.
* A full supabase‑js replacement. It’s focused on REST calls only.

If you need an **ORM**, use Prisma / Drizzle on the server and connect to the same Postgres.

---

## API

### Constructor

```ts
new SupabaseClient(url: string, apiKey: string, authKey?: string, options?: any)
```

* `url`: Supabase **Project URL** (e.g., `https://xxxx.supabase.co`)
* `apiKey`: sent as `apikey` header (typically **Anon** key)
* `authKey`: sent as `Authorization: Bearer ...` (typically **Service Role** key). If omitted, `apiKey` is used for both.

### Query entry

```ts
client.from(table: string): SupabaseQueryBuilder
```

### Select

```ts
.select(columns?: string) // default "*"
.eq(column: string, value: any)
.or(expr: string)         // raw PostgREST OR syntax
.order(column: string, opts?: { ascending?: boolean })
```

Returns (via `await`) `{ data, error }`.

### Insert / Update / Delete

```ts
.insert(rows: any[])      // supports .select("*") and optional .single()
.update(patch: any)       // chain .eq(...).select("*")
.delete()                 // chain .eq(...)
```

All return `{ data, error }`. `single()` is a no‑op kept for call‑site compatibility.

> Under the hood, the client always appends `?select=*` for reads. Errors from `fetch` are mapped to `{ data: null, error }`.

---

## Security & RLS

* **Server‑only**: put keys in environment variables. Never expose `SERVICE_ROLE` to browsers.
* With `SERVICE_ROLE` in `Authorization`, **RLS is bypassed**. That’s intended for trusted server code (e.g., admin routes, internal jobs). Use carefully.
* If you want client‑side reads with `Anon`, don’t pass `authKey` and open **RLS SELECT policies** accordingly.

### Example RLS (read‑only public catalogue)

```sql
alter table public."TB_Products" enable row level security;
create policy "read_all" on public."TB_Products" for select to anon, authenticated using (true);
```

---

## Next.js Route Handler example

```ts
// app/api/products/route.ts
export const runtime = "node";
import { NextResponse } from "next/server";
import { SupabaseClient } from "@divetocode/supa-query-builder";

const supa = new SupabaseClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supa.from("TB_Products").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: String(error) }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const now = new Date().toISOString();
  const { data, error } = await supa
    .from("TB_Products")
    .insert([{ ...body, created_at: now, updated_at: now }])
    .select("*");
  if (error) return NextResponse.json({ error: String(error) }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
```

---

## TypeScript

The return value of each call is:

```ts
type RestResult<T = any> = { data: T | null; error: unknown | null };
```

You can cast `T` to your row type to improve DX:

```ts
interface Product { id: number; name: string; /* ... */ }
const { data } = await supa.from("TB_Products").select("*") as RestResult<Product[]>;
```

---

## Why use this over `@supabase/supabase-js`?

* Need **strict control** of headers (e.g., always `Authorization = SERVICE_ROLE`) without context switching.
* Prefer a tiny, explicit REST layer with minimal dependencies.
* You don’t need storage/auth/realtime helpers from `supabase-js`.

If you need those higher‑level features, use `@supabase/supabase-js` or pair this client with official SDKs.

---

## Roadmap

* Pagination helpers (`range`, `limit`, `offset`)
* More filters (`gt`, `gte`, `lt`, `lte`, `like`, `ilike`)
* Typed column selection utilities
* Better error types and retry/timeout options

---

## Contributing

PRs welcome! Please open an issue first for large changes. Keep the scope minimal to avoid scope‑creep into full ORM territory.

---

## License

MIT © 2025 DiveToCode
