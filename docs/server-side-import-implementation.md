# Server-Side Excel Import Implementation

## Overview

This document describes the server-side implementation of the Excel import functionality for departments and positions in the JobE application. The implementation uses **Next.js Server Actions** to securely execute GraphQL mutations on the Nhost backend.

## Architecture

### Components

```
┌─────────────────────┐
│   Client (Browser)  │
│  useImportWorkflow  │
│      Hook           │
└──────────┬──────────┘
           │ Call Server Action
           ▼
┌─────────────────────┐
│   Server Action     │
│  executeServerImport│  ← Uses HTTP-only cookies for auth
└──────────┬──────────┘
           │ Execute Mutations
           ▼
┌─────────────────────┐
│  Nhost GraphQL API  │
│   (Hasura Backend)  │
└─────────────────────┘
```

### Key Files

1. **`lib/actions/import.ts`** - Server Action (NEW)
   - Executes import on the server side
   - Handles authentication automatically via cookies
   - Processes departments and positions in correct order

2. **`hooks/useImportWorkflow.ts`** - React Hook (UPDATED)
   - Client-side state management
   - Calls the server action for execution
   - Handles UI state transitions

3. **`lib/nhost/graphql/server.ts`** - Server GraphQL utilities
   - `serverExecuteMutation()` - Execute mutations with auth
   - `serverExecuteQuery()` - Execute queries with auth

4. **`lib/nhost/graphql/mutations/import-workflow.ts`** - Utility functions
   - `getImportSummary()` - Generate import summary for preview
   - Old client-side execution logic (deprecated)

## Implementation Details

### Server Action: `executeServerImport()`

**Location:** `lib/actions/import.ts`

**Signature:**
```typescript
export async function executeServerImport(
  organizationId: string,
  departments: DepartmentPreview[],
  positions: PositionPreview[]
): Promise<ImportResult>
```

**Features:**
- ✅ Automatic authentication via HTTP-only cookies
- ✅ Server-side GraphQL execution
- ✅ Hierarchical department creation (parents before children)
- ✅ Proper error handling and rollback
- ✅ Type-safe mutations
- ✅ Works with all environments (local, staging, production)

**Process Flow:**

1. **Validate Inputs**
   - Check organization ID
   - Validate department and position arrays

2. **Process Departments First**
   - Fetch existing departments from database
   - Build `dept_code` → `id` mapping
   - Separate CREATE and UPDATE operations
   - Create departments in hierarchical order:
     - Pass 1: Create root departments (no parent)
     - Pass 2: Create children whose parents now exist
     - Pass N: Continue until all created or error
   - Execute UPDATE operations one by one

3. **Process Positions Second**
   - Refresh department mapping (includes newly created)
   - Fetch existing positions from database
   - Build `pos_code` → `id` mapping
   - Separate CREATE and UPDATE operations
   - Create positions in batch
   - Execute UPDATE operations one by one

4. **Return Results**
   - Total counts for created/updated entities
   - Error details if any operation fails

### GraphQL Mutations

#### Department Insert
```graphql
mutation InsertDepartments($departments: [departments_insert_input!]!) {
  insert_departments(objects: $departments) {
    affected_rows
    returning {
      id
      dept_code
      name
      parent_id
      organization_id
      created_at
      updated_at
    }
  }
}
```

**Required Fields:**
- `organization_id` (uuid) - Target organization
- `dept_code` (text) - Unique department code
- `name` (text) - Department name
- `parent_id` (uuid, nullable) - Parent department ID

**Auto-generated Fields:**
- `id` - Primary key (UUID)
- `created_at` - Timestamp
- `updated_at` - Timestamp

#### Position Insert
```graphql
mutation InsertPositions($positions: [positions_insert_input!]!) {
  insert_positions(objects: $positions) {
    affected_rows
    returning {
      id
      pos_code
      title
      department_id
      reports_to_id
      is_manager
      is_active
      incumbents_count
      organization_id
      created_at
      updated_at
    }
  }
}
```

**Required Fields:**
- `organization_id` (uuid) - Target organization
- `pos_code` (text) - Unique position code
- `title` (text) - Position title
- `department_id` (uuid) - Associated department
- `reports_to_id` (uuid, nullable) - Manager position ID
- `is_manager` (boolean) - Manager flag
- `is_active` (boolean) - Active status
- `incumbents_count` (integer) - Number of people in position

### Authentication

**How It Works:**

1. User logs in → Nhost sets HTTP-only session cookie
2. Client calls Server Action → Cookie automatically sent
3. Server Action uses `serverExecuteMutation()`:
   - Reads cookie from request headers
   - Creates Nhost server client with session
   - Executes GraphQL with authentication
4. Hasura validates JWT from Nhost session
5. Mutation executes with proper permissions

**Security Benefits:**
- ✅ No access tokens in browser JavaScript
- ✅ No manual token management
- ✅ CSRF protection via SameSite cookies
- ✅ HTTPOnly prevents XSS attacks
- ✅ Secure flag ensures HTTPS only

### Environment Configuration

The server-side implementation automatically handles different environments:

#### Local Development
```env
NEXT_PUBLIC_NHOST_SUBDOMAIN=local
NEXT_PUBLIC_NHOST_REGION=""  # Empty for local
```
**GraphQL URL:** `https://local.hasura.local.nhost.run/v1/graphql`

#### Staging
```env
NEXT_PUBLIC_NHOST_SUBDOMAIN=your-subdomain
NEXT_PUBLIC_NHOST_REGION=eu-central-1
```
**GraphQL URL:** `https://your-subdomain.graphql.eu-central-1.nhost.run/v1`

#### Production
```env
NEXT_PUBLIC_NHOST_SUBDOMAIN=your-subdomain
NEXT_PUBLIC_NHOST_REGION=us-east-1
```
**GraphQL URL:** `https://your-subdomain.graphql.us-east-1.nhost.run/v1`

The Nhost client automatically constructs the correct URL based on these environment variables.

## Usage Example

### Client Component

```tsx
'use client';

import { useImportWorkflow } from '@/hooks/useImportWorkflow';

export function ImportComponent() {
  const { confirmImport, context } = useImportWorkflow();

  const handleConfirm = async () => {
    try {
      // This calls the server action automatically
      await confirmImport();
      
      if (context.state === 'SUCCESS') {
        console.log('Import successful!', context.result);
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  return (
    <button onClick={handleConfirm}>
      Confirm Import
    </button>
  );
}
```

### How It Works

1. **Client calls `confirmImport()`** from the hook
2. **Hook calls `executeServerImport()`** Server Action
3. **Server Action executes on server** with automatic auth
4. **GraphQL mutations run** against Hasura backend
5. **Results return to client** via hook state
6. **UI updates** based on success/error state

## Error Handling

### Server-Side Errors

The Server Action throws errors that are caught by the hook:

```typescript
try {
  const result = await executeServerImport(
    organizationId,
    departments,
    positions
  );
} catch (error) {
  // Automatic error propagation to client
  setContext({
    state: ImportWorkflowState.ERROR,
    errorMessage: error.message
  });
}
```

### Common Error Scenarios

1. **Missing Parent Department**
   ```
   Error: Cannot create 3 departments - missing parent references
   ```
   **Solution:** Ensure parent departments exist or are included in import

2. **Circular Reference**
   ```
   Error: Failed to create 2 departments after 10 passes
   ```
   **Solution:** Fix circular parent-child relationships in Excel

3. **Duplicate Code**
   ```
   Error: Uniqueness violation. duplicate key value violates unique constraint
   ```
   **Solution:** Ensure dept_code/pos_code are unique

4. **Authentication Failed**
   ```
   Error: Unauthorized - invalid or missing session
   ```
   **Solution:** User needs to log in again

5. **Invalid Department Reference**
   ```
   Error: Failed to update position POS001: Referenced department not found
   ```
   **Solution:** Ensure all department codes in positions exist

## Migration from Client-Side

### Before (Client-Side)
```typescript
// ❌ Old way - client-side with manual token management
const result = await executeImportWorkflow(
  nhostClient,  // Required client instance
  organizationId,
  departments,
  positions
);
```

### After (Server-Side)
```typescript
// ✅ New way - server action with automatic auth
const result = await executeServerImport(
  organizationId,  // No client needed!
  departments,
  positions
);
```

### Benefits of Migration

1. **Security:** No tokens exposed to browser
2. **Simplicity:** No client management needed
3. **Performance:** Server-side execution is faster
4. **Reliability:** Better error handling and recovery
5. **Maintenance:** Centralized business logic on server

## Testing

### Test Server Action

```typescript
// In your test file
import { executeServerImport } from '@/lib/actions/import';

test('should import departments', async () => {
  const result = await executeServerImport(
    'org-123',
    [
      {
        operation: OperationType.CREATE,
        dept_code: 'IT',
        name: 'IT Department',
        excelRow: 2
      }
    ],
    []
  );

  expect(result.departmentsCreated).toBe(1);
});
```

### Test Hook

```typescript
// In your component test
import { renderHook, act } from '@testing-library/react';
import { useImportWorkflow } from '@/hooks/useImportWorkflow';

test('should execute import via server action', async () => {
  const { result } = renderHook(() => useImportWorkflow());

  await act(async () => {
    await result.current.confirmImport();
  });

  expect(result.current.context.state).toBe('SUCCESS');
});
```

## Performance Considerations

### Batch Operations

- **Departments:** Created in batches per hierarchy level
- **Positions:** Created in single batch (faster)
- **Updates:** Executed one by one (safer)

### Optimization Tips

1. **Large Imports:** Consider chunking (500-1000 rows per batch)
2. **Hierarchy Depth:** Limit to 10 levels to prevent infinite loops
3. **Concurrent Updates:** Currently sequential, could be parallelized
4. **Database Indexes:** Ensure `dept_code` and `pos_code` are indexed

## Troubleshooting

### Enable Debug Logging

```typescript
// In lib/actions/import.ts
console.log('Processing departments:', departments.length);
console.log('Current pass:', currentPass);
console.log('Created so far:', created.length);
```

### Check Hasura Logs

```bash
# View Hasura logs
docker logs nhost_hasura

# Or via Nhost Cloud console
# Navigate to: Logs → GraphQL Engine
```

### Verify Authentication

```typescript
// In lib/nhost/graphql/server.ts
const session = await requireAuth();
console.log('User authenticated:', session.user.id);
```

## Future Enhancements

1. **Progress Tracking:** Real-time updates via WebSocket
2. **Rollback Mechanism:** Undo failed imports
3. **Validation Rules:** Business logic validation on server
4. **Bulk Operations:** Optimize UPDATE operations
5. **Audit Trail:** Track who imported what and when
6. **Rate Limiting:** Prevent abuse of import endpoint

## Summary

The server-side import implementation provides:

✅ **Secure** - Automatic authentication via cookies  
✅ **Simple** - No client management needed  
✅ **Reliable** - Proper error handling  
✅ **Scalable** - Handles hierarchies correctly  
✅ **Maintainable** - Centralized business logic  

The old client-side implementation is now deprecated. All new features should use the Server Action pattern demonstrated here.
