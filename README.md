# Unofficial Enhanced Supabase Client

A comprehensive TypeScript client library that directly utilizes Supabase's REST API for advanced table schema management and CRUD operations. Provides an API similar to the official Supabase client while offering additional schema management capabilities.

## Key Features

- 🔐 **Dual Client Architecture**: Browser client (ANON key) / Server client (SERVICE_ROLE key) separation
- 📊 **Complete Schema Management**: Table creation, modification, deletion, and structure queries
- 🔍 **Full CRUD Operations**: Create, Read, Update, Delete with advanced querying
- 🛡️ **RLS Policy Management**: Comprehensive Row Level Security policy control
- 📈 **Index Management**: Create, modify, and optimize database indexes
- 🔗 **Foreign Key Support**: Full relational database constraint management
- 🎯 **Type Safety**: Complete TypeScript support with robust type definitions
- ⚡ **Promise-based API**: Modern async/await with consistent error handling

## Installation & Setup

```bash
npm install @divetocode/supa-query-builder
# or
yarn add @divetocode/supa-query-builder
```

```typescript
import { SupabaseClient, SupabaseServer } from '@divetocode/supa-query-builder';

// Browser client (read operations focused)
const supabase = new SupabaseClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Server client (includes schema management)
const supabaseServer = new SupabaseServer(
  'https://your-project.supabase.co',
  'your-anon-key',
  'your-service-role-key'
);
```

## 1. Table Schema Management

### 1.1 Querying Table Information

```typescript
// Get all tables list
const { data: tables, error } = await supabaseServer.schema().getTables();

// Get tables from specific schema
const { data: publicTables } = await supabaseServer.schema().getTables('public');

console.log(tables); // [{ name: 'users', schema: 'public' }, { name: 'posts', schema: 'public' }]
```

```typescript
// Get detailed table information including columns
const { data: tableInfo, error } = await supabaseServer.schema().getTableInfo('users');

console.log(tableInfo);
/* Output example:
{
  name: 'users',
  columns: [
    { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
    { name: 'email', type: 'text', nullable: false, unique: true },
    { name: 'name', type: 'text', nullable: true }
  ]
}
*/
```

### 1.2 Table Creation

```typescript
// Basic table creation
const { data, error } = await supabaseServer.schema().createTable('posts', [
  {
    name: 'id',
    type: 'uuid',
    primaryKey: true,
    defaultValue: 'gen_random_uuid()'
  },
  {
    name: 'title',
    type: 'text',
    nullable: false
  },
  {
    name: 'content',
    type: 'text',
    nullable: true
  },
  {
    name: 'author_id',
    type: 'uuid',
    nullable: false,
    references: {
      table: 'users',
      column: 'id',
      onDelete: 'CASCADE'
    }
  },
  {
    name: 'is_published',
    type: 'boolean',
    defaultValue: false
  },
  {
    name: 'view_count',
    type: 'integer',
    defaultValue: 0
  }
]);

// Advanced table creation with options
const { data: advancedTable } = await supabaseServer.schema().createTable('comments', [
  {
    name: 'id',
    type: 'uuid',
    primaryKey: true,
    defaultValue: 'gen_random_uuid()'
  },
  {
    name: 'post_id',
    type: 'uuid',
    references: {
      table: 'posts',
      column: 'id',
      onDelete: 'CASCADE'
    }
  },
  {
    name: 'content',
    type: 'text',
    nullable: false
  }
], {
  schema: 'public',
  enableRLS: true,        // Auto-enable RLS
  addCreatedAt: true,     // Auto-add created_at column
  addUpdatedAt: true      // Auto-add updated_at column
});
```

### 1.3 Table Modifications

#### Adding Columns
```typescript
// Add new column
await supabaseServer.schema().addColumn('posts', {
  name: 'tags',
  type: 'text[]',  // Array type
  nullable: true
});

// Add foreign key column
await supabaseServer.schema().addColumn('posts', {
  name: 'category_id',
  type: 'uuid',
  references: {
    table: 'categories',
    column: 'id',
    onDelete: 'SET NULL'
  }
});

// Add column with constraints
await supabaseServer.schema().addColumn('posts', {
  name: 'slug',
  type: 'text',
  unique: true,
  nullable: false
});
```

#### Modifying Columns
```typescript
// Change column type
await supabaseServer.schema().alterColumn('posts', 'view_count', {
  type: 'bigint'
});

// Change nullable constraint
await supabaseServer.schema().alterColumn('posts', 'content', {
  nullable: false
});

// Set default value
await supabaseServer.schema().alterColumn('posts', 'is_featured', {
  defaultValue: false
});

// Remove default value
await supabaseServer.schema().alterColumn('posts', 'some_column', {
  dropDefault: true
});

// Multiple changes at once
await supabaseServer.schema().alterColumn('posts', 'status', {
  type: 'varchar(50)',
  nullable: false,
  defaultValue: 'draft'
});
```

#### Removing Columns
```typescript
// Drop column
const { data, error } = await supabaseServer.schema().dropColumn('posts', 'old_column');

if (error) {
  console.error('Failed to drop column:', error.message);
}
```

#### Renaming
```typescript
// Rename column
await supabaseServer.schema().renameColumn('posts', 'content', 'body');

// Rename table
await supabaseServer.schema().renameTable('posts', 'articles');
```

### 1.4 Table Operations

```typescript
// Drop table (with cascade to remove dependent objects)
const { data, error } = await supabaseServer.schema().dropTable('posts', 'public', true);

// Simple table drop
await supabaseServer.schema().dropTable('temp_table');

// Copy table structure only
await supabaseServer.schema().copyTable('posts', 'posts_backup', false);

// Copy table with data
await supabaseServer.schema().copyTable('posts', 'posts_archive', true);

// Check if table exists
const { data: exists } = await supabaseServer.schema().tableExists('posts');
console.log(exists); // true or false
```

## 2. Index Management

```typescript
// Create single column index
await supabaseServer.schema().createIndex('posts', 'idx_posts_author', ['author_id']);

// Create composite index
await supabaseServer.schema().createIndex('posts', 'idx_posts_author_published', 
  ['author_id', 'is_published']
);

// Create unique index
await supabaseServer.schema().createIndex('users', 'idx_users_email_unique', ['email'], {
  unique: true
});

// Create index with specific method
await supabaseServer.schema().createIndex('posts', 'idx_posts_content_gin', ['content'], {
  method: 'gin'  // For full-text search
});

// Create partial index with condition
await supabaseServer.schema().createIndex('posts', 'idx_posts_published', ['created_at'], {
  method: 'btree',
  // Note: Partial indexes require custom SQL - this would need additional RPC function
});

// Drop index
await supabaseServer.schema().dropIndex('idx_posts_author');
```

## 3. Advanced CRUD Operations

### 3.1 Reading Data (SELECT)

```typescript
// Select all data
const { data: allPosts, error } = await supabase.from('posts').select('*');

// Select specific columns
const { data: titles } = await supabase.from('posts').select('id, title, created_at');

// Conditional selection
const { data: publishedPosts } = await supabase
  .from('posts')
  .select('*')
  .eq('is_published', true);

// Ordering results
const { data: recentPosts } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false });

// Complex filtering
const { data: filteredPosts } = await supabase
  .from('posts')
  .select('*')
  .eq('author_id', 'user-uuid')
  .eq('is_published', true)
  .order('view_count', { ascending: false });

// OR conditions
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .or('is_featured.eq.true,view_count.gte.1000');

// Complex queries with joins (using Supabase's embedded resources)
const { data: postsWithAuthors } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    content,
    view_count,
    created_at,
    users!posts_author_id_fkey (
      id,
      name,
      email,
      avatar_url
    ),
    comments (
      id,
      content,
      created_at
    )
  `)
  .eq('is_published', true)
  .order('created_at', { ascending: false });

// Pagination
const { data: paginatedPosts } = await supabase
  .from('posts')
  .select('*')
  .range(0, 9)  // First 10 items
  .order('created_at', { ascending: false });

// Count with data
const { data: posts, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .eq('is_published', true);

// Text search
const { data: searchResults } = await supabase
  .from('posts')
  .select('*')
  .textSearch('title', 'javascript', { type: 'websearch' });
```

### 3.2 Creating Data (INSERT)

```typescript
// Insert single record
const { data: newPost, error } = await supabase
  .from('posts')
  .insert({
    title: 'New Blog Post',
    content: 'This is the content of the post.',
    author_id: 'user-uuid',
    is_published: true
  })
  .select()
  .single();

// Insert multiple records
const { data: newPosts } = await supabase
  .from('posts')
  .insert([
    {
      title: 'First Post',
      content: 'First content',
      author_id: 'user-uuid'
    },
    {
      title: 'Second Post',
      content: 'Second content',
      author_id: 'user-uuid'
    }
  ])
  .select();

// Insert with specific columns returned
const { data: createdPost } = await supabase
  .from('posts')
  .insert({
    title: 'Title',
    content: 'Content',
    author_id: 'user-uuid'
  })
  .select('id, title, created_at')
  .single();

// Upsert (insert or update if exists)
const { data: upsertedPost } = await supabase
  .from('posts')
  .upsert({
    id: 'existing-uuid',
    title: 'Updated or New Title',
    content: 'Updated or new content'
  })
  .select()
  .single();

// Insert with conflict resolution
const { data } = await supabase
  .from('users')
  .insert({
    email: 'user@example.com',
    name: 'John Doe'
  })
  .onConflict('email')  // If email conflicts, do nothing
  .select()
  .single();
```

### 3.3 Updating Data (UPDATE)

```typescript
// Update specific record
const { data: updatedPost, error } = await supabase
  .from('posts')
  .update({
    title: 'Updated Title',
    content: 'Updated Content',
    updated_at: new Date().toISOString()
  })
  .eq('id', 'post-uuid')
  .select()
  .single();

// Update multiple records
const { data: updatedPosts } = await supabase
  .from('posts')
  .update({ is_published: true })
  .eq('author_id', 'user-uuid')
  .select();

// Conditional updates with complex conditions
const { data } = await supabase
  .from('posts')
  .update({ is_featured: true })
  .gte('view_count', 1000)
  .eq('is_published', true)
  .select();

// Increment values
const { data: post } = await supabase
  .from('posts')
  .update({ view_count: 'view_count + 1' })  // SQL expression
  .eq('id', 'post-uuid')
  .select('id, view_count')
  .single();

// Update with JSON operations
const { data } = await supabase
  .from('posts')
  .update({
    metadata: {
      tags: ['javascript', 'tutorial'],
      difficulty: 'beginner'
    }
  })
  .eq('id', 'post-uuid')
  .select();

// Batch update with different conditions
const updates = [
  { id: 'post1', view_count: 100 },
  { id: 'post2', view_count: 200 }
];

for (const update of updates) {
  await supabase
    .from('posts')
    .update({ view_count: update.view_count })
    .eq('id', update.id);
}
```

### 3.4 Deleting Data (DELETE)

```typescript
// Delete specific record
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', 'post-uuid');

// Delete multiple records with conditions
const { error: deleteError } = await supabase
  .from('posts')
  .delete()
  .eq('is_published', false)
  .eq('author_id', 'user-uuid');

// Delete and return deleted data
const { data: deletedPosts } = await supabase
  .from('posts')
  .delete()
  .eq('author_id', 'inactive-user-uuid')
  .select();

// Soft delete (update instead of delete)
const { data } = await supabase
  .from('posts')
  .update({ 
    deleted_at: new Date().toISOString(),
    is_published: false 
  })
  .eq('id', 'post-uuid')
  .select();

// Delete with complex conditions
const { error } = await supabase
  .from('posts')
  .delete()
  .lt('view_count', 10)
  .eq('is_published', false)
  .lt('created_at', '2023-01-01');
```

## 4. Row Level Security (RLS) Management

### 4.1 RLS Status Management

```typescript
// Enable RLS
await supabaseServer.rls('posts').enableRLS();

// Disable RLS (Security Warning: Use with caution!)
await supabaseServer.rls('posts').disableRLS();

// Check RLS status
const { data: rlsStatus } = await supabaseServer.rls('posts').checkRLSStatus();
console.log(rlsStatus); // { enabled: true }
```

### 4.2 Creating RLS Policies

```typescript
// Basic policy creation
await supabaseServer.rls('posts').createPolicy(
  'posts_select_policy',
  'SELECT',
  'auth.uid() = author_id'
);

// Public read policy (items where is_public = true)
await supabaseServer.rls('posts').createPublicReadPolicy();

// Open access policy (Security Warning: Use with extreme caution!)
await supabaseServer.rls('posts').createOpenPolicy();

// User-specific access policy
await supabaseServer.rls('posts').createPolicy(
  'posts_user_policy',
  'ALL',
  'auth.uid() = author_id OR is_public = true'
);

// Complex policies with multiple conditions
await supabaseServer.rls('posts').createPolicy(
  'posts_advanced_read',
  'SELECT',
  `
    (auth.uid() = author_id) OR 
    (is_published = true AND is_public = true) OR
    (auth.uid() IN (SELECT user_id FROM collaborators WHERE post_id = posts.id))
  `
);

// Time-based policies
await supabaseServer.rls('posts').createPolicy(
  'posts_scheduled_publish',
  'SELECT',
  'is_published = true AND published_at <= now()'
);

// Role-based policies
await supabaseServer.rls('posts').createPolicy(
  'posts_admin_access',
  'ALL',
  `
    auth.uid() = author_id OR 
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'moderator'
  `
);
```

### 4.3 Managing RLS Policies

```typescript
// List all policies for a table
const { data: policies } = await supabaseServer.rls('posts').getPolicies();

console.log(policies);
/* Output example:
[
  {
    name: 'posts_select_policy',
    operation: 'SELECT',
    condition: 'auth.uid() = author_id',
    enabled: true
  }
]
*/

// Drop specific policy
await supabaseServer.rls('posts').dropPolicy('posts_select_policy');

// Drop all policies (use with caution)
const { data: allPolicies } = await supabaseServer.rls('posts').getPolicies();
for (const policy of allPolicies) {
  await supabaseServer.rls('posts').dropPolicy(policy.name);
}
```

### 4.4 Testing Access Permissions (Browser)

```typescript
// Test current user's table access permissions
const { data: accessTest } = await supabase.rls('posts').testAccess();

console.log(accessTest);
/* Output:
{
  canAccess: true,
  status: 200,
  message: 'Access granted'
}
*/

// Test access for different operations
async function testTableAccess(tableName: string) {
  const tests = [
    { operation: 'SELECT', test: () => supabase.from(tableName).select('*').limit(1) },
    { operation: 'INSERT', test: () => supabase.from(tableName).insert({}).select() },
    { operation: 'UPDATE', test: () => supabase.from(tableName).update({}).eq('id', 'test') },
    { operation: 'DELETE', test: () => supabase.from(tableName).delete().eq('id', 'test') }
  ];

  for (const { operation, test } of tests) {
    try {
      await test();
      console.log(`${operation} on ${tableName}: ALLOWED`);
    } catch (error) {
      console.log(`${operation} on ${tableName}: DENIED - ${error.message}`);
    }
  }
}
```

## 5. Real-World Usage Examples

### 5.1 Complete Blog System Implementation

```typescript
async function setupBlogSystem() {
  // 1. Create users table
  await supabaseServer.schema().createTable('users', [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
      defaultValue: 'gen_random_uuid()'
    },
    {
      name: 'email',
      type: 'text',
      nullable: false,
      unique: true
    },
    {
      name: 'name',
      type: 'text',
      nullable: false
    },
    {
      name: 'avatar_url',
      type: 'text',
      nullable: true
    },
    {
      name: 'bio',
      type: 'text',
      nullable: true
    },
    {
      name: 'role',
      type: 'text',
      defaultValue: 'user'
    }
  ], { enableRLS: true });

  // 2. Create categories table
  await supabaseServer.schema().createTable('categories', [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
      defaultValue: 'gen_random_uuid()'
    },
    {
      name: 'name',
      type: 'text',
      nullable: false,
      unique: true
    },
    {
      name: 'slug',
      type: 'text',
      nullable: false,
      unique: true
    },
    {
      name: 'description',
      type: 'text',
      nullable: true
    }
  ], { enableRLS: true });

  // 3. Create posts table
  await supabaseServer.schema().createTable('posts', [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
      defaultValue: 'gen_random_uuid()'
    },
    {
      name: 'title',
      type: 'text',
      nullable: false
    },
    {
      name: 'slug',
      type: 'text',
      nullable: false,
      unique: true
    },
    {
      name: 'content',
      type: 'text',
      nullable: false
    },
    {
      name: 'excerpt',
      type: 'text',
      nullable: true
    },
    {
      name: 'author_id',
      type: 'uuid',
      references: {
        table: 'users',
        column: 'id',
        onDelete: 'CASCADE'
      }
    },
    {
      name: 'category_id',
      type: 'uuid',
      references: {
        table: 'categories',
        column: 'id',
        onDelete: 'SET NULL'
      }
    },
    {
      name: 'is_published',
      type: 'boolean',
      defaultValue: false
    },
    {
      name: 'published_at',
      type: 'timestamp',
      nullable: true
    },
    {
      name: 'view_count',
      type: 'integer',
      defaultValue: 0
    },
    {
      name: 'tags',
      type: 'text[]',
      nullable: true
    },
    {
      name: 'featured_image_url',
      type: 'text',
      nullable: true
    }
  ], { enableRLS: true });

  // 4. Create comments table
  await supabaseServer.schema().createTable('comments', [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
      defaultValue: 'gen_random_uuid()'
    },
    {
      name: 'post_id',
      type: 'uuid',
      references: {
        table: 'posts',
        column: 'id',
        onDelete: 'CASCADE'
      }
    },
    {
      name: 'user_id',
      type: 'uuid',
      references: {
        table: 'users',
        column: 'id',
        onDelete: 'CASCADE'
      }
    },
    {
      name: 'content',
      type: 'text',
      nullable: false
    },
    {
      name: 'parent_id',
      type: 'uuid',
      references: {
        table: 'comments',
        column: 'id',
        onDelete: 'CASCADE'
      }
    },
    {
      name: 'is_approved',
      type: 'boolean',
      defaultValue: false
    }
  ], { enableRLS: true });

  // 5. Create performance indexes
  const indexes = [
    { table: 'posts', name: 'idx_posts_author', columns: ['author_id'] },
    { table: 'posts', name: 'idx_posts_published', columns: ['is_published', 'published_at'] },
    { table: 'posts', name: 'idx_posts_category', columns: ['category_id'] },
    { table: 'posts', name: 'idx_posts_slug', columns: ['slug'], options: { unique: true } },
    { table: 'comments', name: 'idx_comments_post', columns: ['post_id'] },
    { table: 'comments', name: 'idx_comments_user', columns: ['user_id'] },
    { table: 'users', name: 'idx_users_email', columns: ['email'], options: { unique: true } },
    { table: 'categories', name: 'idx_categories_slug', columns: ['slug'], options: { unique: true } }
  ];

  for (const index of indexes) {
    await supabaseServer.schema().createIndex(
      index.table, 
      index.name, 
      index.columns, 
      index.options
    );
  }

  // 6. Set up RLS policies
  
  // Users policies
  await supabaseServer.rls('users').createPolicy(
    'users_read_public',
    'SELECT',
    'true'  // Users profiles are public
  );
  
  await supabaseServer.rls('users').createPolicy(
    'users_update_own',
    'UPDATE',
    'auth.uid() = id'
  );

  // Categories policies (public read)
  await supabaseServer.rls('categories').createPolicy(
    'categories_read_public',
    'SELECT',
    'true'
  );

  // Posts policies
  await supabaseServer.rls('posts').createPolicy(
    'posts_read_published',
    'SELECT',
    'is_published = true AND published_at <= now()'
  );
  
  await supabaseServer.rls('posts').createPolicy(
    'posts_author_full_access',
    'ALL',
    'auth.uid() = author_id'
  );
  
  await supabaseServer.rls('posts').createPolicy(
    'posts_admin_access',
    'ALL',
    `auth.jwt() ->> 'role' IN ('admin', 'moderator')`
  );

  // Comments policies
  await supabaseServer.rls('comments').createPolicy(
    'comments_read_approved',
    'SELECT',
    'is_approved = true'
  );
  
  await supabaseServer.rls('comments').createPolicy(
    'comments_user_crud',
    'ALL',
    'auth.uid() = user_id'
  );

  console.log('Blog system setup completed successfully!');
}
```

### 5.2 Blog Operations

```typescript
// Create a new blog post
async function createBlogPost(postData: {
  title: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  tags?: string[];
  featuredImageUrl?: string;
}) {
  // Generate slug from title
  const slug = postData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { data: newPost, error } = await supabase
    .from('posts')
    .insert({
      title: postData.title,
      slug: slug,
      content: postData.content,
      excerpt: postData.excerpt,
      category_id: postData.categoryId,
      tags: postData.tags,
      featured_image_url: postData.featuredImageUrl,
      is_published: false,  // Draft by default
      author_id: 'current-user-id'  // Get from auth context
    })
    .select(`
      id,
      title,
      slug,
      content,
      is_published,
      created_at,
      categories (
        name,
        slug
      )
    `)
    .single();

  return { data: newPost, error };
}

// Publish a post
async function publishPost(postId: string) {
  const { data, error } = await supabase
    .from('posts')
    .update({
      is_published: true,
      published_at: new Date().toISOString()
    })
    .eq('id', postId)
    .eq('author_id', 'current-user-id')  // Ensure user owns the post
    .select()
    .single();

  return { data, error };
}

// Get published posts with pagination
async function getPublishedPosts(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;

  const { data: posts, error, count } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      slug,
      excerpt,
      view_count,
      published_at,
      featured_image_url,
      tags,
      users!posts_author_id_fkey (
        id,
        name,
        avatar_url
      ),
      categories (
        name,
        slug
      )
    `, { count: 'exact' })
    .eq('is_published', true)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    data: posts,
    error,
    totalCount: count,
    totalPages: count ? Math.ceil(count / limit) : 0,
    currentPage: page
  };
}

// Get single post with comments
async function getPostWithComments(slug: string) {
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      slug,
      content,
      view_count,
      published_at,
      tags,
      featured_image_url,
      users!posts_author_id_fkey (
        id,
        name,
        avatar_url,
        bio
      ),
      categories (
        name,
        slug
      ),
      comments!comments_post_id_fkey (
        id,
        content,
        created_at,
        users!comments_user_id_fkey (
          name,
          avatar_url
        )
      )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (post) {
    // Increment view count
    await supabase
      .from('posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', post.id);
  }

  return { data: post, error };
}

// Add comment to post
async function addComment(postId: string, content: string, parentId?: string) {
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      content: content,
      parent_id: parentId,
      user_id: 'current-user-id',  // Get from auth context
      is_approved: false  // Requires moderation
    })
    .select(`
      id,
      content,
      created_at,
      users!comments_user_id_fkey (
        name,
        avatar_url
      )
    `)
    .single();

  return { data: comment, error };
}

// Search posts
async function searchPosts(query: string, categoryId?: string) {
  let queryBuilder = supabase
    .from('posts')
    .select(`
      id,
      title,
      slug,
      excerpt,
      published_at,
      tags,
      users!posts_author_id_fkey (
        name
      ),
      categories (
        name,
        slug
      )
    `)
    .eq('is_published', true)
    .textSearch('title', query, { type: 'websearch' });

  if (categoryId) {
    queryBuilder = queryBuilder.eq('category_id', categoryId);
  }

  const { data: posts, error } = await queryBuilder
    .order('published_at', { ascending: false });

  return { data: posts, error };
}
```

### 5.3 E-commerce System Implementation

```typescript
async function setupEcommerceSystem() {
  // 1. Create products table
  await supabaseServer.schema().createTable('products', [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
      defaultValue: 'gen_random_uuid()'
    },
    {
      name: 'name',
      type: 'text',
      nullable: false
    },
    {
      name: 'slug',
      type: 'text',
      nullable: false,
      unique: true
    },
    {
      name: 'description',
      type: 'text',
      nullable: true
    },
    {
      name: 'price',
      type: 'decimal(10,2)',
      nullable: false
    },
    {
      name: 'compare_at_price',
      type: 'decimal(10,2)',
      nullable: true
    },
    {
      name: 'cost',
      type: 'decimal(10,2)',
      nullable: true
    },
    {
      name: 'sku',
      type: 'text',
      unique: true,
      nullable: true
    },
    {
      name: 'inventory_quantity',
      type: 'integer',
      defaultValue: 0
    },
    {
      name: 'track_inventory',
      type: 'boolean',
      defaultValue: true
    },
    {
      name: 'weight',
      type: 'decimal(8,2)',
      nullable: true
    },
    {
      name: 'is_active',
      type: 'boolean',
      defaultValue: true
    },
    {
      name: 'featured_image_url',
      type: 'text',
      nullable: true
    },
    {
      name: 'images',
      type: 'jsonb',
      defaultValue: '[]'
    },
    {
      name: 'tags',
      type: 'text[]',
      nullable: true
    },
    {
      name: 'seo_title',
      type: 'text',
      nullable: true
    },
    {
      name: 'seo_description',
      type: 'text',
      nullable: true
    }
  ], { enableRLS: true });

  // 2. Create product categories
  await supabaseServer.schema().createTable('product_categories', [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
      defaultValue: 'gen_random_uuid()'
    },
    {
      name: 'name',
      type: 'text',
      nullable: false
    },
    {
      name: 'slug',
      type: 'text',
      nullable: false,
      unique: true
    },
    {
      name: 'parent_id',
      type: 'uuid',
      references: {
        table: 'product_categories',
        column: 'id',
        onDelete: 'SET NULL'
      }
    },
    {
      name: 'description',
      type: 'text',
      nullable: true
    },
    {
      name: 'image_url',
      type: 'text',
      nullable: true
    },
    {
      name: 'sort_order',
      type: 'integer',
      defaultValue: 0
    }
  ], { enableRLS: true });

  // 3. Create product-category junction table
  await supabaseServer.schema().createTable('product_category_relations', [
    {
      name: 'product_id',
      type: 'uuid',
      references: {
        table: 'products',
        column: 'id',
        onDelete: 'CASCADE'
      }
    },
    {
      name: 'category_id',
      type: 'uuid',
      references: {
        table: 'product_categories',
        column: 'id',
        onDelete: 'CASCADE'
      }
    }
  ], { enableRLS: true });

  // Add composite primary key
  await supabaseServer.schema().createIndex(
    'product_category_relations',
    'product_category_relations_pkey',
    ['product_id', 'category_id'],
    { unique: true }
  );

  // 4. Create orders table
  await supabaseServer.schema().createTable('orders', [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
      defaultValue: 'gen_random_uuid()'
    },
    {
      name: 'order_number',
      type: 'text',
      nullable: false,
      unique: true
    },
    {
      name: 'user_id',
      type: 'uuid',
      references: {
        table: 'users',
        column: 'id',
        onDelete: 'SET NULL'
      }
    },
    {
      name: 'email',
      type: 'text',
      nullable: false
    },
    {
      name: 'status',
      type: 'text',
      defaultValue: 'pending'
    },
    {
      name: 'subtotal',
      type: 'decimal(10,2)',
      nullable: false
    },
    {
      name: 'tax_amount',
      type: 'decimal(10,2)',
      defaultValue: 0
    },
    {
      name: 'shipping_amount',
      type: 'decimal(10,2)',
      defaultValue: 0
    },
    {
      name: 'total_amount',
      type: 'decimal(10,2)',
      nullable: false
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'USD'
    },
    {
      name: 'shipping_address',
      type: 'jsonb',
      nullable: true
    },
    {
      name: 'billing_address',
      type: 'jsonb',
      nullable: true
    },
    {
      name: 'notes',
      type: 'text',
      nullable: true
    }
  ], { enableRLS: true });

  // 5. Create order items table
  await supabaseServer.schema().createTable('order_items', [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
      defaultValue: 'gen_random_uuid()'
    },
    {
      name: 'order_id',
      type: 'uuid',
      references: {
        table: 'orders',
        column: 'id',
        onDelete: 'CASCADE'
      }
    },
    {
      name: 'product_id',
      type: 'uuid',
      references: {
        table: 'products',
        column: 'id',
        onDelete: 'CASCADE'
      }
    },
    {
      name: 'quantity',
      type: 'integer',
      nullable: false
    },
    {
      name: 'unit_price',
      type: 'decimal(10,2)',
      nullable: false
    },
    {
      name: 'total_price',
      type: 'decimal(10,2)',
      nullable: false
    },
    {
      name: 'product_snapshot',
      type: 'jsonb',
      nullable: true  // Store product details at time of purchase
    }
  ], { enableRLS: true });

  // Create performance indexes for e-commerce
  const ecommerceIndexes = [
    { table: 'products', name: 'idx_products_active', columns: ['is_active'] },
    { table: 'products', name: 'idx_products_price', columns: ['price'] },
    { table: 'products', name: 'idx_products_inventory', columns: ['inventory_quantity'] },
    { table: 'products', name: 'idx_products_slug', columns: ['slug'], options: { unique: true } },
    { table: 'products', name: 'idx_products_sku', columns: ['sku'], options: { unique: true } },
    { table: 'product_categories', name: 'idx_categories_parent', columns: ['parent_id'] },
    { table: 'product_categories', name: 'idx_categories_slug', columns: ['slug'], options: { unique: true } },
    { table: 'orders', name: 'idx_orders_user', columns: ['user_id'] },
    { table: 'orders', name: 'idx_orders_status', columns: ['status'] },
    { table: 'orders', name: 'idx_orders_number', columns: ['order_number'], options: { unique: true } },
    { table: 'order_items', name: 'idx_order_items_order', columns: ['order_id'] },
    { table: 'order_items', name: 'idx_order_items_product', columns: ['product_id'] }
  ];

  for (const index of ecommerceIndexes) {
    await supabaseServer.schema().createIndex(
      index.table,
      index.name,
      index.columns,
      index.options
    );
  }

  // Set up RLS policies for e-commerce
  
  // Products - public read for active products
  await supabaseServer.rls('products').createPolicy(
    'products_public_read',
    'SELECT',
    'is_active = true'
  );

  // Categories - public read
  await supabaseServer.rls('product_categories').createPolicy(
    'categories_public_read',
    'SELECT',
    'true'
  );

  // Product-category relations - public read
  await supabaseServer.rls('product_category_relations').createPolicy(
    'product_categories_public_read',
    'SELECT',
    'true'
  );

  // Orders - users can only see their own orders
  await supabaseServer.rls('orders').createPolicy(
    'orders_user_read',
    'SELECT',
    'auth.uid() = user_id'
  );

  await supabaseServer.rls('orders').createPolicy(
    'orders_user_create',
    'INSERT',
    'auth.uid() = user_id'
  );

  // Order items - can read items from user's orders
  await supabaseServer.rls('order_items').createPolicy(
    'order_items_user_read',
    'SELECT',
    'EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())'
  );

  console.log('E-commerce system setup completed successfully!');
}

// E-commerce operations
async function getProductsByCategory(categorySlug: string, filters?: {
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'created_at';
}) {
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      description,
      price,
      compare_at_price,
      featured_image_url,
      tags,
      inventory_quantity,
      product_category_relations!inner (
        product_categories!inner (
          slug
        )
      )
    `)
    .eq('is_active', true)
    .eq('product_category_relations.product_categories.slug', categorySlug);

  // Apply filters
  if (filters?.minPrice) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters?.maxPrice) {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  // Apply sorting
  switch (filters?.sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data: products, error } = await query;
  return { data: products, error };
}

async function createOrder(orderData: {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: any;
  billingAddress?: any;
  notes?: string;
}) {
  // First, get product details and calculate totals
  const productIds = orderData.items.map(item => item.productId);
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, inventory_quantity')
    .in('id', productIds);

  if (productsError || !products) {
    return { data: null, error: productsError };
  }

  // Check inventory and calculate totals
  let subtotal = 0;
  const orderItems = [];

  for (const item of orderData.items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      return { data: null, error: new Error(`Product ${item.productId} not found`) };
    }
    if (product.inventory_quantity < item.quantity) {
      return { data: null, error: new Error(`Insufficient inventory for ${product.name}`) };
    }

    const totalPrice = product.price * item.quantity;
    subtotal += totalPrice;

    orderItems.push({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: product.price,
      total_price: totalPrice,
      product_snapshot: {
        name: product.name,
        price: product.price
      }
    });
  }

  // Calculate tax and shipping (simplified)
  const taxAmount = subtotal * 0.1; // 10% tax
  const shippingAmount = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const totalAmount = subtotal + taxAmount + shippingAmount;

  // Generate order number
  const orderNumber = `ORD-${Date.now()}`;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: 'current-user-id', // Get from auth context
      email: 'user@example.com', // Get from user profile
      subtotal: subtotal,
      tax_amount: taxAmount,
      shipping_amount: shippingAmount,
      total_amount: totalAmount,
      shipping_address: orderData.shippingAddress,
      billing_address: orderData.billingAddress || orderData.shippingAddress,
      notes: orderData.notes,
      status: 'pending'
    })
    .select()
    .single();

  if (orderError) {
    return { data: null, error: orderError };
  }

  // Create order items
  const orderItemsWithOrderId = orderItems.map(item => ({
    ...item,
    order_id: order.id
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsWithOrderId);

  if (itemsError) {
    // Rollback order creation if items fail
    await supabase.from('orders').delete().eq('id', order.id);
    return { data: null, error: itemsError };
  }

  // Update inventory
  for (const item of orderData.items) {
    await supabase
      .from('products')
      .update({
        inventory_quantity: `inventory_quantity - ${item.quantity}`
      })
      .eq('id', item.productId);
  }

  return { data: order, error: null };
}
```

## 6. Database Migration and Maintenance

### 6.1 Schema Migration Example

```typescript
interface Migration {
  version: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: '001',
    description: 'Add user profiles table',
    up: async () => {
      await supabaseServer.schema().createTable('user_profiles', [
        {
          name: 'user_id',
          type: 'uuid',
          primaryKey: true,
          references: {
            table: 'auth.users',
            column: 'id',
            onDelete: 'CASCADE'
          }
        },
        {
          name: 'first_name',
          type: 'text',
          nullable: true
        },
        {
          name: 'last_name',
          type: 'text',
          nullable: true
        },
        {
          name: 'phone',
          type: 'text',
          nullable: true
        }
      ], { enableRLS: true });

      await supabaseServer.rls('user_profiles').createPolicy(
        'user_profiles_own_access',
        'ALL',
        'auth.uid() = user_id'
      );
    },
    down: async () => {
      await supabaseServer.schema().dropTable('user_profiles');
    }
  },
  {
    version: '002',
    description: 'Add blog post slugs',
    up: async () => {
      await supabaseServer.schema().addColumn('posts', {
        name: 'slug',
        type: 'text',
        unique: true,
        nullable: true
      });

      await supabaseServer.schema().createIndex('posts', 'idx_posts_slug', ['slug'], {
        unique: true
      });
    },
    down: async () => {
      await supabaseServer.schema().dropIndex('idx_posts_slug');
      await supabaseServer.schema().dropColumn('posts', 'slug');
    }
  }
];

async function runMigrations() {
  // Create migrations table if it doesn't exist
  const { data: exists } = await supabaseServer.schema().tableExists('migrations');
  
  if (!exists) {
    await supabaseServer.schema().createTable('migrations', [
      {
        name: 'version',
        type: 'text',
        primaryKey: true
      },
      {
        name: 'description',
        type: 'text',
        nullable: false
      },
      {
        name: 'executed_at',
        type: 'timestamp',
        defaultValue: 'now()'
      }
    ]);
  }

  // Get executed migrations
  const { data: executedMigrations } = await supabase
    .from('migrations')
    .select('version');

  const executedVersions = new Set(
    executedMigrations?.map(m => m.version) || []
  );

  // Run pending migrations
  for (const migration of migrations) {
    if (!executedVersions.has(migration.version)) {
      try {
        console.log(`Running migration ${migration.version}: ${migration.description}`);
        await migration.up();
        
        // Record migration as executed
        await supabase.from('migrations').insert({
          version: migration.version,
          description: migration.description
        });
        
        console.log(`Migration ${migration.version} completed successfully`);
      } catch (error) {
        console.error(`Migration ${migration.version} failed:`, error);
        // Optionally run rollback
        try {
          await migration.down();
        } catch (rollbackError) {
          console.error(`Rollback failed for ${migration.version}:`, rollbackError);
        }
        break;
      }
    }
  }
}
```

### 6.2 Data Backup and Restore

```typescript
async function backupTable(tableName: string, includeData: boolean = true) {
  // Get table structure
  const { data: tableInfo } = await supabaseServer.schema().getTableInfo(tableName);
  
  if (!tableInfo) {
    throw new Error(`Table ${tableName} not found`);
  }

  const backup = {
    tableName,
    structure: tableInfo,
    data: null as any[],
    createdAt: new Date().toISOString()
  };

  if (includeData) {
    // Get all data from table
    const { data: tableData } = await supabase
      .from(tableName)
      .select('*');
    
    backup.data = tableData || [];
  }

  // Save backup to file or storage
  const backupJson = JSON.stringify(backup, null, 2);
  
  // In a real application, you would save this to file system or cloud storage
  console.log(`Backup created for ${tableName}:`, backupJson);
  
  return backup;
}

async function restoreTable(backup: any) {
  const { tableName, structure, data } = backup;
  
  // Check if table exists
  const { data: exists } = await supabaseServer.schema().tableExists(tableName);
  
  if (!exists) {
    // Recreate table structure
    const columns = structure.columns.map((col: any) => ({
      name: col.name,
      type: col.type,
      nullable: col.nullable,
      primaryKey: col.primaryKey,
      unique: col.unique,
      defaultValue: col.defaultValue,
      references: col.references
    }));
    
    await supabaseServer.schema().createTable(tableName, columns);
  }

  if (data && data.length > 0) {
    // Insert data in batches
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await supabase.from(tableName).insert(batch);
    }
  }

  console.log(`Table ${tableName} restored successfully`);
}
```

### 6.3 Performance Monitoring

```typescript
async function analyzeTablePerformance(tableName: string) {
  // Get table statistics (would need custom RPC functions)
  const { data: stats } = await supabaseServer.executeRPC('get_table_stats', {
    table_name: tableName
  });

  // Analyze slow queries (would need custom logging)
  const { data: slowQueries } = await supabaseServer.executeRPC('get_slow_queries', {
    table_name: tableName,
    min_duration: 1000 // queries slower than 1 second
  });

  // Check index usage
  const { data: indexStats } = await supabaseServer.executeRPC('get_index_usage', {
    table_name: tableName
  });

  return {
    tableStats: stats,
    slowQueries: slowQueries,
    indexUsage: indexStats
  };
}

async function optimizeTable(tableName: string) {
  const performance = await analyzeTablePerformance(tableName);
  
  const recommendations = [];

  // Check for missing indexes
  if (performance.slowQueries) {
    for (const query of performance.slowQueries) {
      if (query.type === 'seq_scan') {
        recommendations.push({
          type: 'add_index',
          message: `Consider adding index on columns: ${query.columns.join(', ')}`,
          sql: `CREATE INDEX idx_${tableName}_${query.columns.join('_')} ON ${tableName} (${query.columns.join(', ')});`
        });
      }
    }
  }

  // Check for unused indexes
  if (performance.indexUsage) {
    for (const index of performance.indexUsage) {
      if (index.usage_count < 10) {
        recommendations.push({
          type: 'remove_index',
          message: `Index ${index.name} is rarely used, consider removing it`,
          sql: `DROP INDEX ${index.name};`
        });
      }
    }
  }

  return recommendations;
}
```

## 7. Advanced Error Handling and Logging

```typescript
interface DatabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

class DatabaseOperations {
  private static logError(operation: string, error: DatabaseError, context?: any) {
    console.error(`Database Error in ${operation}:`, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      context: context,
      timestamp: new Date().toISOString()
    });
  }

  static async safeExecute<T>(
    operation: string,
    fn: () => Promise<{ data: T | null; error: any }>,
    context?: any
  ): Promise<{ data: T | null; error: DatabaseError | null }> {
    try {
      const result = await fn();
      
      if (result.error) {
        this.logError(operation, result.error, context);
        return { data: null, error: result.error };
      }
      
      return result;
    } catch (error) {
      const dbError = error as DatabaseError;
      this.logError(operation, dbError, context);
      return { data: null, error: dbError };
    }
  }

  static async retryOperation<T>(
    operation: string,
    fn: () => Promise<{ data: T | null; error: any }>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<{ data: T | null; error: DatabaseError | null }> {
    let lastError: DatabaseError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.safeExecute(operation, fn, { attempt });
      
      if (!result.error) {
        return result;
      }

      lastError = result.error;

      // Don't retry for certain error types
      if (result.error.code === '23505') { // unique_violation
        break;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    return { data: null, error: lastError };
  }
}

// Usage examples
async function createPostWithErrorHandling(postData: any) {
  return DatabaseOperations.safeExecute(
    'create_post',
    () => supabase.from('posts').insert(postData).select().single(),
    { postData }
  );
}

async function createPostWithRetry(postData: any) {
  return DatabaseOperations.retryOperation(
    'create_post_retry',
    () => supabase.from('posts').insert(postData).select().single(),
    3, // max retries
    1000 // base delay
  );
}
```

## 8. Security Best Practices

### 8.1 Environment Configuration

```typescript
// config/database.ts
interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
  environment: 'development' | 'staging' | 'production';
}

const config: DatabaseConfig = {
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Server only!
  environment: (process.env.NODE_ENV as any) || 'development'
};

// Never expose service role key to browser
export const getBrowserClient = () => {
  return new SupabaseClient(config.url, config.anonKey);
};

export const getServerClient = () => {
  if (!config.serviceRoleKey) {
    throw new Error('Service role key not configured');
  }
  return new SupabaseServer(config.url, config.anonKey, config.serviceRoleKey);
};
```

### 8.2 Input Validation and Sanitization

```typescript
import { z } from 'zod';

// Define schemas for data validation
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10),
  author_id: z.string().uuid(),
  is_published: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  category_id: z.string().uuid().optional()
});

async function createValidatedPost(rawData: any) {
  try {
    // Validate input data
    const validatedData = createPostSchema.parse(rawData);
    
    // Sanitize content (remove dangerous HTML, etc.)
    const sanitizedData = {
      ...validatedData,
      content: sanitizeHtml(validatedData.content),
      title: validatedData.title.trim()
    };

    // Create post
    const { data, error } = await supabase
      .from('posts')
      .insert(sanitizedData)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        data: null, 
        error: { 
          message: 'Validation failed', 
          details: error.errors 
        } 
      };
    }
    throw error;
  }
}

function sanitizeHtml(html: string): string {
  // Implement HTML sanitization
  // This is a simplified example - use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}
```

## 9. Testing

```typescript
// tests/database.test.ts
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { SupabaseServer, SupabaseClient } from '../src/index';

describe('Supabase Client Library', () => {
  let serverClient: SupabaseServer;
  let browserClient: SupabaseClient;
  const testTableName = 'test_posts';

  beforeAll(async () => {
    serverClient = new SupabaseServer(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    browserClient = new SupabaseClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  });

  beforeEach(async () => {
    // Clean up test data
    await serverClient.schema().dropTable(testTableName);
  });

  describe('Schema Management', () => {
    test('should create table with columns', async () => {
      const { data, error } = await serverClient.schema().createTable(testTableName, [
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          defaultValue: 'gen_random_uuid()'
        },
        {
          name: 'title',
          type: 'text',
          nullable: false
        },
        {
          name: 'content',
          type: 'text',
          nullable: true
        }
      ]);

      expect(error).toBeNull();
      
      // Verify table exists
      const { data: exists } = await serverClient.schema().tableExists(testTableName);
      expect(exists).toBe(true);
    });

    test('should add column to existing table', async () => {
      // Create table first
      await serverClient.schema().createTable(testTableName, [
        { name: 'id', type: 'uuid', primaryKey: true }
      ]);

      // Add column
      const { error } = await serverClient.schema().addColumn(testTableName, {
        name: 'description',
        type: 'text',
        nullable: true
      });

      expect(error).toBeNull();

      // Verify column exists
      const { data: tableInfo } = await serverClient.schema().getTableInfo(testTableName);
      const hasDescColumn = tableInfo?.columns.some(col => col.name === 'description');
      expect(hasDescColumn).toBe(true);
    });

    test('should create index', async () => {
      await serverClient.schema().createTable(testTableName, [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'title', type: 'text' }
      ]);

      const { error } = await serverClient.schema().createIndex(
        testTableName,
        'idx_test_title',
        ['title']
      );

      expect(error).toBeNull();
    });
  });

  describe('CRUD Operations', () => {
    beforeEach(async () => {
      await serverClient.schema().createTable(testTableName, [
        {
          name: 'id',
          type: 'uuid',
          primaryKey: true,
          defaultValue: 'gen_random_uuid()'
        },
        {
          name: 'title',
          type: 'text',
          nullable: false
        },
        {
          name: 'content',
          type: 'text',
          nullable: true
        },
        {
          name: 'is_published',
          type: 'boolean',
          defaultValue: false
        }
      ]);

      // Create open policy for testing
      await serverClient.rls(testTableName).enableRLS();
      await serverClient.rls(testTableName).createOpenPolicy();
    });

    test('should insert and retrieve data', async () => {
      const testData = {
        title: 'Test Post',
        content: 'Test content',
        is_published: true
      };

      // Insert data
      const { data: inserted, error: insertError } = await browserClient
        .from(testTableName)
        .insert(testData)
        .select()
        .single();

      expect(insertError).toBeNull();
      expect(inserted).toBeDefined();
      expect(inserted.title).toBe(testData.title);

      // Retrieve data
      const { data: retrieved, error: selectError } = await browserClient
        .from(testTableName)
        .select('*')
        .eq('id', inserted.id)
        .single();

      expect(selectError).toBeNull();
      expect(retrieved).toBeDefined();
      expect(retrieved.title).toBe(testData.title);
    });

    test('should update data', async () => {
      // Insert test data
      const { data: inserted } = await browserClient
        .from(testTableName)
        .insert({ title: 'Original Title', content: 'Original content' })
        .select()
        .single();

      // Update data
      const updatedData = { title: 'Updated Title' };
      const { data: updated, error } = await browserClient
        .from(testTableName)
        .update(updatedData)
        .eq('id', inserted.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated.title).toBe(updatedData.title);
      expect(updated.content).toBe('Original content'); // Should remain unchanged
    });

    test('should delete data', async () => {
      // Insert test data
      const { data: inserted } = await browserClient
        .from(testTableName)
        .insert({ title: 'To Delete', content: 'Will be deleted' })
        .select()
        .single();

      // Delete data
      const { error: deleteError } = await browserClient
        .from(testTableName)
        .delete()
        .eq('id', inserted.id);

      expect(deleteError).toBeNull();

      // Verify deletion
      const { data: retrieved } = await browserClient
        .from(testTableName)
        .select('*')
        .eq('id', inserted.id)
        .single();

      expect(retrieved).toBeNull();
    });

    test('should filter and order data', async () => {
      // Insert multiple test records
      const testPosts = [
        { title: 'Post A', content: 'Content A', is_published: true },
        { title: 'Post B', content: 'Content B', is_published: false },
        { title: 'Post C', content: 'Content C', is_published: true }
      ];

      await browserClient.from(testTableName).insert(testPosts);

      // Filter published posts
      const { data: publishedPosts, error } = await browserClient
        .from(testTableName)
        .select('*')
        .eq('is_published', true)
        .order('title', { ascending: true });

      expect(error).toBeNull();
      expect(publishedPosts).toHaveLength(2);
      expect(publishedPosts[0].title).toBe('Post A');
      expect(publishedPosts[1].title).toBe('Post C');
    });
  });

  describe('RLS Management', () => {
    beforeEach(async () => {
      await serverClient.schema().createTable(testTableName, [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'title', type: 'text' },
        { name: 'user_id', type: 'uuid' },
        { name: 'is_public', type: 'boolean', defaultValue: false }
      ]);
    });

    test('should enable and disable RLS', async () => {
      // Enable RLS
      const { error: enableError } = await serverClient.rls(testTableName).enableRLS();
      expect(enableError).toBeNull();

      // Check RLS status
      const { data: statusEnabled } = await serverClient.rls(testTableName).checkRLSStatus();
      expect(statusEnabled.enabled).toBe(true);

      // Disable RLS
      const { error: disableError } = await serverClient.rls(testTableName).disableRLS();
      expect(disableError).toBeNull();

      // Check RLS status again
      const { data: statusDisabled } = await serverClient.rls(testTableName).checkRLSStatus();
      expect(statusDisabled.enabled).toBe(false);
    });

    test('should create and manage policies', async () => {
      await serverClient.rls(testTableName).enableRLS();

      // Create policy
      const { error: createError } = await serverClient.rls(testTableName).createPolicy(
        'test_policy',
        'SELECT',
        'auth.uid() = user_id'
      );
      expect(createError).toBeNull();

      // List policies
      const { data: policies, error: listError } = await serverClient.rls(testTableName).getPolicies();
      expect(listError).toBeNull();
      expect(policies).toBeDefined();
      expect(policies.some(p => p.name === 'test_policy')).toBe(true);

      // Drop policy
      const { error: dropError } = await serverClient.rls(testTableName).dropPolicy('test_policy');
      expect(dropError).toBeNull();
    });

    test('should create public read policy', async () => {
      await serverClient.rls(testTableName).enableRLS();

      const { error } = await serverClient.rls(testTableName).createPublicReadPolicy();
      expect(error).toBeNull();

      // Verify policy exists
      const { data: policies } = await serverClient.rls(testTableName).getPolicies();
      const publicPolicy = policies?.find(p => p.name.includes('public_read'));
      expect(publicPolicy).toBeDefined();
    });
  });

  afterAll(async () => {
    // Clean up test table
    await serverClient.schema().dropTable(testTableName);
  });
});

// Performance tests
describe('Performance Tests', () => {
  let serverClient: SupabaseServer;
  const testTableName = 'perf_test_table';

  beforeAll(async () => {
    serverClient = new SupabaseServer(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create test table
    await serverClient.schema().createTable(testTableName, [
      { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'gen_random_uuid()' },
      { name: 'name', type: 'text' },
      { name: 'value', type: 'integer' },
      { name: 'category', type: 'text' }
    ]);

    await serverClient.rls(testTableName).enableRLS();
    await serverClient.rls(testTableName).createOpenPolicy();
  });

  test('bulk insert performance', async () => {
    const startTime = Date.now();
    
    // Insert 1000 records
    const records = Array.from({ length: 1000 }, (_, i) => ({
      name: `Record ${i}`,
      value: Math.floor(Math.random() * 100),
      category: `Category ${i % 10}`
    }));

    const browserClient = new SupabaseClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const { error } = await browserClient.from(testTableName).insert(records);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    console.log(`Bulk insert of 1000 records took ${duration}ms`);
  });

  test('query with index performance', async () => {
    // Create index
    await serverClient.schema().createIndex(testTableName, 'idx_category', ['category']);
    
    const startTime = Date.now();
    
    const browserClient = new SupabaseClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const { data, error } = await browserClient
      .from(testTableName)
      .select('*')
      .eq('category', 'Category 5');
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
    console.log(`Indexed query took ${duration}ms, returned ${data?.length} records`);
  });

  afterAll(async () => {
    await serverClient.schema().dropTable(testTableName);
  });
});
```

## 10. Production Deployment Checklist

### 10.1 Environment Setup

```typescript
// production-checklist.ts
interface ProductionChecklist {
  item: string;
  completed: boolean;
  description: string;
}

const productionChecklist: ProductionChecklist[] = [
  {
    item: 'Environment Variables',
    completed: false,
    description: 'Ensure all required environment variables are set and SERVICE_ROLE key is secure'
  },
  {
    item: 'RLS Policies',
    completed: false,
    description: 'All tables have appropriate RLS policies configured'
  },
  {
    item: 'Indexes',
    completed: false,
    description: 'Performance indexes are created for frequently queried columns'
  },
  {
    item: 'Backup Strategy',
    completed: false,
    description: 'Database backup and restore procedures are in place'
  },
  {
    item: 'Error Handling',
    completed: false,
    description: 'Comprehensive error handling and logging implemented'
  },
  {
    item: 'Rate Limiting',
    completed: false,
    description: 'API rate limiting configured to prevent abuse'
  },
  {
    item: 'Monitoring',
    completed: false,
    description: 'Database performance and error monitoring setup'
  },
  {
    item: 'Testing',
    completed: false,
    description: 'Unit tests, integration tests, and performance tests passing'
  }
];

async function validateProductionReadiness() {
  console.log('Production Readiness Checklist:\n');
  
  for (const item of productionChecklist) {
    const status = item.completed ? '✅' : '❌';
    console.log(`${status} ${item.item}`);
    console.log(`   ${item.description}\n`);
  }
}
```

### 10.2 Monitoring and Alerting

```typescript
// monitoring.ts
class DatabaseMonitor {
  private serverClient: SupabaseServer;
  
  constructor(serverClient: SupabaseServer) {
    this.serverClient = serverClient;
  }

  async checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: any;
    issues: string[];
  }> {
    const issues: string[] = [];
    const metrics: any = {};
    
    try {
      // Test basic connectivity
      const startTime = Date.now();
      const { data: tables } = await this.serverClient.schema().getTables();
      const responseTime = Date.now() - startTime;
      
      metrics.responseTime = responseTime;
      metrics.tableCount = tables?.length || 0;
      
      if (responseTime > 5000) {
        issues.push(`Slow database response: ${responseTime}ms`);
      }
      
      // Check for table-specific issues
      for (const table of tables || []) {
        const { data: rlsStatus } = await this.serverClient.rls(table.name).checkRLSStatus();
        if (!rlsStatus?.enabled && !['migrations', 'logs'].includes(table.name)) {
          issues.push(`RLS not enabled for table: ${table.name}`);
        }
      }
      
      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (issues.length > 0) {
        status = issues.length > 3 ? 'unhealthy' : 'degraded';
      }
      
      return { status, metrics, issues };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        metrics: { error: error.message },
        issues: ['Database connection failed']
      };
    }
  }

  async logDatabaseMetrics() {
    const health = await this.checkDatabaseHealth();
    
    // Log to your monitoring service (e.g., DataDog, New Relic, etc.)
    console.log('Database Health Check:', {
      timestamp: new Date().toISOString(),
      status: health.status,
      metrics: health.metrics,
      issues: health.issues
    });
    
    // Send alerts if unhealthy
    if (health.status === 'unhealthy') {
      await this.sendAlert('Database is unhealthy', health.issues);
    }
  }

  private async sendAlert(title: string, issues: string[]) {
    // Implement your alerting mechanism here
    // e.g., Slack, email, PagerDuty, etc.
    console.error(`ALERT: ${title}`, issues);
  }
}

// Usage
const monitor = new DatabaseMonitor(serverClient);

// Run health checks periodically
setInterval(async () => {
  await monitor.logDatabaseMetrics();
}, 60000); // Every minute
```

## Security Warnings

⚠️ **CRITICAL SECURITY CONSIDERATIONS**

1. **SERVICE_ROLE Key Security**
   - Never expose SERVICE_ROLE keys to browser environments
   - Store in secure environment variables only
   - Rotate keys regularly
   - Use separate keys for different environments

2. **RLS Policy Validation**
   - Always enable RLS on production tables
   - Test policies thoroughly before deployment
   - Use principle of least privilege
   - Regular security audits of policies

3. **Input Validation**
   - Validate all user inputs on both client and server
   - Sanitize data before database operations
   - Use parameterized queries to prevent injection attacks
   - Implement rate limiting for API endpoints

4. **Data Protection**
   - Encrypt sensitive data at rest
   - Use HTTPS for all communications
   - Implement proper backup encryption
   - Regular security vulnerability assessments

## Required PostgreSQL Functions

This library requires several custom PostgreSQL functions to be created in your Supabase database. Contact your database administrator to implement these RPC functions:

### Schema Management Functions
```sql
-- Example function (actual implementation varies)
CREATE OR REPLACE FUNCTION get_tables_info(target_schema text DEFAULT 'public')
RETURNS TABLE(name text, schema text) AS $
BEGIN
  RETURN QUERY
  SELECT schemaname::text, tablename::text 
  FROM pg_tables 
  WHERE schemaname = target_schema;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Required Functions List:**
- `get_tables_info` - List tables in schema
- `get_table_info` - Get table column details
- `create_table` - Create new table with columns
- `drop_table` - Remove table
- `add_column` - Add column to table
- `alter_column` - Modify column properties
- `drop_column` - Remove column
- `rename_table` - Change table name
- `rename_column` - Change column name
- `create_index` - Create database index
- `drop_index` - Remove index
- `copy_table` - Duplicate table structure/data
- `table_exists` - Check table existence
- `get_table_policies` - List RLS policies
- `enable_rls` - Enable Row Level Security
- `disable_rls` - Disable Row Level Security
- `create_rls_policy` - Create RLS policy
- `drop_rls_policy` - Remove RLS policy
- `check_rls_status` - Get RLS status

## Contributing

We welcome contributions to improve this library! Please follow these guidelines:

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-repo/supa-query-builder.git
   cd supa-query-builder
   npm install
   ```

2. **Development Setup**
   ```bash
   cp .env.example .env
   # Configure your test Supabase instance
   npm run test
   ```

3. **Pull Request Guidelines**
   - Write tests for new features
   - Update documentation
   - Follow TypeScript best practices
   - Ensure all tests pass

## Changelog

### v2.1.0
- Added comprehensive error handling with retry logic
- Implemented database health monitoring
- Enhanced TypeScript definitions
- Added performance optimization utilities

### v2.0.0
- **Breaking**: Separated browser and server clients
- Added complete schema management
- Enhanced RLS policy management
- Improved error handling and logging

### v1.0.0
- Initial release with basic CRUD operations
- Basic schema management functionality
- RLS policy support

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support and Resources

- 📧 [Email Support](divetocode.official@gmail.com)
- 🔗 [Supabase Documentation](https://supabase.com/docs)

---

**Made with ❤️ for the Supabase community**
