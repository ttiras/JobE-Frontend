# Department Import with parent_id Migration

## Overview
Updated the department import system to use `parent_id` (UUID) instead of `parent_dept_code` (TEXT) for parent-child relationships. This provides proper foreign key relationships and better data integrity.

## Database Schema Changes

### Old Schema (parent_dept_code)
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  dept_code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_dept_code TEXT,  -- ❌ Text reference
  ...
);
```

### New Schema (parent_id)
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  dept_code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID,  -- ✅ Proper foreign key to departments.id
  FOREIGN KEY (parent_id) REFERENCES departments(id),
  ...
);
```

## Implementation Details

### 1. Hierarchical Department Creation

The system now creates departments in multiple passes to respect the parent-child hierarchy:

**Algorithm:**
1. Query existing departments to build `dept_code -> id` map
2. For each pass:
   - Identify departments that can be created (root or parent exists)
   - Create this batch via GraphQL mutation
   - Update the `dept_code -> id` map with new departments
   - Remove created departments from pending list
3. Repeat until all departments are created or error occurs

**Features:**
- ✅ Handles unlimited hierarchy depth
- ✅ Creates roots first, then children in correct order
- ✅ Prevents orphaned departments
- ✅ Detects circular references
- ✅ Maximum 10 passes to prevent infinite loops

### 2. Department Updates

Updates also resolve `parent_dept_code` to `parent_id`:

1. Query all departments in organization
2. Build `dept_code -> id` map
3. For each department to update:
   - Resolve parent code to parent UUID
   - Update department with parent_id

### 3. Mutation Changes

#### INSERT_DEPARTMENTS
```graphql
mutation InsertDepartments($departments: [departments_insert_input!]!) {
  insert_departments(objects: $departments) {
    affected_rows
    returning {
      id
      dept_code
      name
      parent_id        # ✅ Changed from parent_dept_code
      organization_id
      created_at
      updated_at
    }
  }
}
```

#### UPDATE_DEPARTMENT
```graphql
mutation UpdateDepartment(
  $organization_id: uuid!
  $dept_code: String!
  $changes: departments_set_input!
) {
  update_departments(
    where: {
      organization_id: { _eq: $organization_id }
      dept_code: { _eq: $dept_code }
    }
    _set: $changes
  ) {
    affected_rows
    returning {
      id
      dept_code
      name
      parent_id      # ✅ Changed from parent_dept_code
      updated_at
    }
  }
}
```

## Data Flow

### Excel → Parser → Validator → Import

1. **Excel File**: Contains `parent_dept_code` column
2. **Parser**: Extracts `parent_dept_code` as string
3. **Validator**: Validates hierarchy (roots, references, circular)
4. **Import Workflow**:
   - Resolves `parent_dept_code` → `parent_id` UUID
   - Creates departments in correct order
   - Updates existing departments with new parent_id

## Example

### Input Excel Data
```
dept_code | name              | parent_dept_code
----------|-------------------|------------------
GM        | Genel Müdürlük    | -
IT        | IT Department     | GM
DEV       | Development       | IT
QA        | Quality Assurance | IT
```

### Processing Flow

**Pass 1:** Create root (GM)
```typescript
{
  dept_code: "GM",
  name: "Genel Müdürlük",
  parent_id: null  // Root department
}
// Returns: id = "uuid-1"
```

**Pass 2:** Create IT (parent exists)
```typescript
{
  dept_code: "IT",
  name: "IT Department",
  parent_id: "uuid-1"  // Resolved from parent_dept_code="GM"
}
// Returns: id = "uuid-2"
```

**Pass 3:** Create DEV and QA (parent exists)
```typescript
[
  {
    dept_code: "DEV",
    name: "Development",
    parent_id: "uuid-2"  // Resolved from parent_dept_code="IT"
  },
  {
    dept_code: "QA",
    name: "Quality Assurance",
    parent_id: "uuid-2"  // Resolved from parent_dept_code="IT"
  }
]
```

## Error Handling

### Circular References
```typescript
// Detected during validation phase
validateCircularReferences([
  { dept_code: "A", parent_dept_code: "B" },
  { dept_code: "B", parent_dept_code: "A" }
]);
// Returns: ERROR - "Circular reference detected: A -> B -> A"
```

### Missing Parent
```typescript
// Detected during import phase
// If after N passes some departments still can't be created
throw new Error("Cannot create 2 departments - missing parent references");
```

### Multiple Roots
```typescript
// Detected during validation phase
validateDepartmentHierarchy([
  { dept_code: "GM1", parent_dept_code: null },
  { dept_code: "GM2", parent_dept_code: null }
]);
// Returns: WARNING - "Multiple root departments found"
```

## Benefits

1. **Data Integrity**: Foreign key constraints prevent orphaned departments
2. **Performance**: UUID lookups faster than string comparisons
3. **Flexibility**: Easier to rename dept_code without breaking relationships
4. **Consistency**: Standard pattern for all hierarchical relationships
5. **Safety**: Prevents invalid parent references at database level

## Migration Checklist

- [x] Update INSERT_DEPARTMENTS mutation (parent_id)
- [x] Update INSERT_DEPARTMENT mutation (parent_id)
- [x] Update UPDATE_DEPARTMENT mutation (parent_id)
- [x] Implement hierarchical creation algorithm
- [x] Update department creation logic
- [x] Update department update logic
- [x] Add comprehensive logging
- [x] Test with multi-level hierarchy
- [ ] Update database schema (run migration)
- [ ] Update Hasura permissions
- [ ] Test with real data

## Next Steps

1. **Database Migration**: Run SQL to add parent_id column and foreign key
2. **Data Migration**: If existing data, migrate parent_dept_code to parent_id
3. **Remove Old Fields**: After migration, drop parent_dept_code column
4. **Update Queries**: Update any queries still using parent_dept_code

## Files Modified

1. `/lib/nhost/graphql/mutations/import-workflow.ts` - Hierarchical creation logic
2. `/lib/nhost/graphql/mutations/departments.ts` - Updated mutations
3. `/hooks/useImportWorkflow.ts` - Added comprehensive logging
4. `/components/import/import-wizard.tsx` - Fixed state transitions
