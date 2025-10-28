# Database Schema Setup

## Problem
The application is throwing GraphQL errors because the database schema doesn't match what the frontend queries expect:
- `field 'org_size' not found in type: 'organizations'`
- `field 'deleted_at' not found in type: 'organizations_bool_exp'`
- `field 'organizations' not found in type: 'query_root'` (permission issue)

## Solution
Apply the database schema from `docs/database-schema.sql` to your Nhost database.

## Instructions

### Option 1: Using Nhost Console (Recommended)

1. Go to your Nhost Console: https://app.nhost.io
2. Select your project
3. Navigate to **Database** → **SQL Editor**
4. Copy the contents of `docs/database-schema.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute the schema

### Option 2: Using Nhost CLI

If you're running Nhost locally:

```bash
# Make sure Nhost is running
nhost up

# Apply the schema using psql
psql -h localhost -p 5432 -U postgres -d nhost < docs/database-schema.sql
```

### Option 3: Using Hasura Console

1. Open Hasura Console (usually at http://localhost:9695 for local dev)
2. Go to **Data** tab
3. Click on **SQL** in the left sidebar
4. Copy and paste the contents of `docs/database-schema.sql`
5. Check "Track this" for tables if prompted
6. Click **Run!**

## What the Schema Creates

1. **Enum Tables**:
   - `org_size` - Organization size options (1-10, 11-50, etc.)
   - `industries_enum` - Industry categories

2. **Main Tables**:
   - `organizations` - Stores organization data with soft delete support

3. **Features**:
   - Foreign key relationships
   - Indexes for performance
   - Automatic `updated_at` timestamp
   - Row Level Security (RLS) policies
   - Soft delete support via `deleted_at` field

## Verify Installation

After applying the schema, verify it's working:

1. Check tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'org_size', 'industries_enum');
```

2. Test a query from your app (should work now):
```graphql
query GetOrgSizes {
  org_size {
    value
    comment
  }
}
```

## Hasura Metadata Tracking

After creating the tables, you need to track them in Hasura:

1. Go to Hasura Console → **Data** tab
2. For each table (`organizations`, `org_size`, `industries_enum`):
   - If not already tracked, click **Track** button
3. Set up relationships:
   - In `organizations` table, track the foreign key relationships to `org_size` and `industries_enum`

## Permissions (Already Handled in SQL)

The SQL script creates RLS policies, but you may also need to set Hasura permissions:

### For `organizations` table:
- **user role**:
  - Select: `{ "created_by": { "_eq": "X-Hasura-User-Id" } }`
  - Insert: `{ "created_by": { "_eq": "X-Hasura-User-Id" } }`
  - Update: `{ "created_by": { "_eq": "X-Hasura-User-Id" } }`
  - Delete: `{ "created_by": { "_eq": "X-Hasura-User-Id" } }`

### For `org_size` and `industries_enum` tables:
- **public role** and **user role**:
  - Select: `{}` (allow all)

## Troubleshooting

If you still see errors after applying the schema:

1. **Clear GraphQL cache**: Restart your Next.js dev server
2. **Reload Hasura metadata**: In Hasura Console, go to Settings → Reload Metadata
3. **Check permissions**: Ensure your user role has proper permissions in Hasura
4. **Verify RLS**: Check that Row Level Security policies are active

## Next Steps

After the schema is applied, your application should work correctly with:
- ✅ Organization creation and listing
- ✅ Soft delete functionality
- ✅ Enum dropdowns for sizes and industries
