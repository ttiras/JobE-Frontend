# Data Model: Excel Import for Departments and Positions

**Feature**: Excel Import  
**Date**: October 29, 2025  
**Status**: Complete

## Overview

This document defines the data structures, entities, relationships, and validation rules for the Excel import feature. The model supports upsert operations (create + update) for departments and positions with code-based references and hierarchical relationships.

## Core Entities

### 1. Department

**Purpose**: Represents an organizational unit within a company's hierarchy

**Database Table**: `departments` (existing)

**Fields**:
| Field | Type | Nullable | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `id` | uuid | No | Primary key, auto-generated | Unique identifier |
| `organization_id` | uuid | No | Foreign key to organizations | Owning organization |
| `dept_code` | text | No | Unique within organization | Human-readable unique code |
| `name` | text | No | Max 255 chars | Department name |
| `parent_id` | uuid | Yes | Foreign key to departments.id, self-reference | Parent department (null = root) |
| `metadata` | jsonb | Yes | Valid JSON | Flexible additional data |
| `created_at` | timestamp | No | Auto-generated | Creation timestamp |
| `updated_at` | timestamp | No | Auto-updated | Last update timestamp |

**Indexes**:
- Primary: `id`
- Unique: `(organization_id, dept_code)`
- Foreign key: `parent_id → departments(id)`
- Foreign key: `organization_id → organizations(id)`

**Constraints**:
- `dept_code` must be unique per organization
- `parent_id` must reference valid department in same organization (if not null)
- No circular parent_id chains (validated at application layer)

**Excel Mapping**:
| Excel Column | Maps To | Required | Notes |
|--------------|---------|----------|-------|
| `dept_code` | `dept_code` | Yes | Unique identifier for upsert detection |
| `name` | `name` | Yes | Display name |
| `parent_dept_code` | Resolved to `parent_id` | No | References another dept's dept_code |
| `metadata` | `metadata` | No | Must be valid JSON if provided |

---

### 2. Position

**Purpose**: Represents a job role/position within a department

**Database Table**: `positions` (existing)

**Fields**:
| Field | Type | Nullable | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `id` | uuid | No | Primary key, auto-generated | Unique identifier |
| `organization_id` | uuid | No | Foreign key to organizations | Owning organization |
| `department_id` | uuid | No | Foreign key to departments.id | Containing department |
| `pos_code` | text | No | Unique within organization | Human-readable unique code |
| `title` | text | No | Max 255 chars | Position title |
| `reports_to_id` | uuid | Yes | Foreign key to positions.id, self-reference | Manager position (null = top-level) |
| `is_manager` | boolean | No | Default: false | Whether position has direct reports |
| `is_active` | boolean | No | Default: true | Whether position is currently active |
| `incumbents_count` | integer | No | Default: 1, >= 0 | Number of people in this position |
| `created_at` | timestamp | No | Auto-generated | Creation timestamp |
| `updated_at` | timestamp | No | Auto-updated | Last update timestamp |

**Indexes**:
- Primary: `id`
- Unique: `(organization_id, pos_code)`
- Foreign key: `department_id → departments(id)`
- Foreign key: `reports_to_id → positions(id)`
- Foreign key: `organization_id → organizations(id)`

**Constraints**:
- `pos_code` must be unique per organization
- `department_id` must reference valid department in same organization
- `reports_to_id` must reference valid position in same organization (if not null)
- No circular reports_to_id chains (validated at application layer)
- `incumbents_count` >= 0

**Excel Mapping**:
| Excel Column | Maps To | Required | Notes |
|--------------|---------|----------|-------|
| `pos_code` | `pos_code` | Yes | Unique identifier for upsert detection |
| `title` | `title` | Yes | Display name |
| `dept_code` | Resolved to `department_id` | Yes | References department's dept_code |
| `reports_to_pos_code` | Resolved to `reports_to_id` | No | References another position's pos_code |
| `is_manager` | `is_manager` | No | Accepts TRUE/FALSE or 1/0, default false |
| `is_active` | `is_active` | No | Accepts TRUE/FALSE or 1/0, default true |
| `incumbents_count` | `incumbents_count` | No | Must be integer >= 0, default 1 |

---

## Import-Specific Entities

### 3. ImportPreview

**Purpose**: Temporary structure for displaying import preview to user before confirmation

**Lifecycle**: Exists only in API response, not persisted

**Structure**:
```typescript
interface ImportPreview {
  summary: {
    totalRows: number;
    departments: {
      total: number;
      creates: number;
      updates: number;
    };
    positions: {
      total: number;
      creates: number;
      updates: number;
    };
  };
  
  departments: DepartmentPreview[];
  positions: PositionPreview[];
  
  validationStatus: 'valid' | 'errors';
  errors?: ValidationError[];
}

interface DepartmentPreview {
  operation: 'create' | 'update';
  dept_code: string;
  name: string;
  parent_dept_code?: string;
  metadata?: Record<string, any>;
  excelRow: number; // For error reporting
}

interface PositionPreview {
  operation: 'create' | 'update';
  pos_code: string;
  title: string;
  dept_code: string;
  reports_to_pos_code?: string;
  is_manager: boolean;
  is_active: boolean;
  incumbents_count: number;
  excelRow: number; // For error reporting
}
```

---

### 4. ValidationError

**Purpose**: Structured error information for client display

**Structure**:
```typescript
interface ValidationError {
  type: ErrorType;
  severity: 'error' | 'warning';
  row: number; // Excel row number (1-indexed)
  sheet: 'Departments' | 'Positions';
  column?: string; // Column name that caused error
  message: string; // Human-readable error message (localized)
  suggestion?: string; // How to fix (localized)
  affectedCodes?: string[]; // For circular refs or multi-record errors
}

type ErrorType =
  | 'invalid_file_format'
  | 'missing_sheet'
  | 'missing_column'
  | 'missing_required_field'
  | 'duplicate_code_in_file'
  | 'duplicate_code_in_database'
  | 'invalid_reference'
  | 'circular_reference'
  | 'invalid_data_type'
  | 'invalid_json'
  | 'file_too_large';
```

---

## Relationships

### Department Hierarchy

```
           [EXEC] (root, parent_id = null)
          /     \
      [HR]       [IT]
                   \
                 [IT-DEV]
```

- **Type**: Self-referential tree (parent_id → id)
- **Constraint**: No cycles (enforced by DFS validation)
- **Root nodes**: `parent_id IS NULL`
- **Depth**: Unlimited (practical limit ~10 levels)

### Position Reporting Structure

```
              [CEO] (reports_to_id = null)
            /      \
     [HR-DIR]      [IT-DIR]
                      \
                   [IT-DEV-MGR]
                      /     \
              [IT-DEV-01] [IT-DEV-02]
```

- **Type**: Self-referential tree (reports_to_id → id)
- **Constraint**: No cycles (enforced by DFS validation)
- **Top-level**: `reports_to_id IS NULL`
- **Depth**: Unlimited (practical limit ~7-8 levels in most orgs)

### Position-Department Association

```
Department [IT-DEV] ──< contains >── [IT-DEV-MGR, IT-DEV-01, IT-DEV-02]
```

- **Type**: Many-to-one (position belongs to one department)
- **Constraint**: `department_id` must be valid and in same organization
- **Cascade**: Departm delete behavior TBD (not part of import feature)

---

## Validation Rules

### File-Level Validation

1. **File format**: Must be .xlsx or .xls (MIME type check)
2. **File size**: Must be ≤ 5MB
3. **Sheet presence**: At least one of 'Departments' or 'Positions' must exist
4. **Sheet names**: Case-sensitive exact match

### Department Sheet Validation

| Rule | Type | Description | Error Message |
|------|------|-------------|---------------|
| Required columns | Schema | `dept_code`, `name` must exist | "Missing required column: {column}" |
| dept_code uniqueness (file) | Constraint | No duplicate dept_codes in import file | "Duplicate dept_code in row {row}: {code}" |
| dept_code uniqueness (db) | Constraint | dept_code not already used in org (for creates) | "dept_code {code} already exists in organization" |
| parent_dept_code reference | Reference | Must exist in file or database (if provided) | "parent_dept_code '{code}' not found in Departments sheet or existing data" |
| Circular reference | Graph | No cycles in parent_dept_code chains | "Circular reference detected: {path}" |
| metadata JSON | Format | Valid JSON if provided | "Invalid JSON in metadata at row {row}" |
| Required fields | Data | dept_code and name not empty | "Missing required field '{field}' at row {row}" |

### Position Sheet Validation

| Rule | Type | Description | Error Message |
|------|------|-------------|---------------|
| Required columns | Schema | `pos_code`, `title`, `dept_code` must exist | "Missing required column: {column}" |
| pos_code uniqueness (file) | Constraint | No duplicate pos_codes in import file | "Duplicate pos_code in row {row}: {code}" |
| pos_code uniqueness (db) | Constraint | pos_code not already used in org (for creates) | "pos_code {code} already exists in organization" |
| dept_code reference | Reference | Must exist in Departments sheet or database | "dept_code '{code}' not found in Departments sheet or existing data" |
| reports_to_pos_code reference | Reference | Must exist in file or database (if provided) | "reports_to_pos_code '{code}' not found in Positions sheet or existing data" |
| Circular reference | Graph | No cycles in reports_to_pos_code chains | "Circular reference detected: {path}" |
| is_manager format | Format | Boolean (TRUE/FALSE, 1/0, or empty) | "Invalid boolean value for is_manager at row {row}" |
| is_active format | Format | Boolean (TRUE/FALSE, 1/0, or empty) | "Invalid boolean value for is_active at row {row}" |
| incumbents_count format | Format | Integer >= 0 (or empty) | "incumbents_count must be a non-negative integer at row {row}" |
| Required fields | Data | pos_code, title, dept_code not empty | "Missing required field '{field}' at row {row}" |

### Row-Level Processing Rules

1. **Blank rows**: Skip rows where all cells are empty
2. **Partial data**: Error if any cell has data but required fields are missing
3. **Default values**: Apply defaults for optional fields if not provided:
   - `is_manager`: false
   - `is_active`: true
   - `incumbents_count`: 1

---

## Upsert Detection Logic

### Department Upsert

```sql
-- Query existing departments by codes
SELECT id, dept_code
FROM departments
WHERE organization_id = $1
  AND dept_code = ANY($2::text[]);
```

**Logic**:
- If `dept_code` exists in results → **UPDATE** operation
- If `dept_code` not in results → **CREATE** operation

**Update fields**: `name`, `parent_id` (resolved from parent_dept_code), `metadata`, `updated_at`

**Create fields**: All fields plus auto-generated `id`, `created_at`

### Position Upsert

```sql
-- Query existing positions by codes
SELECT id, pos_code
FROM positions
WHERE organization_id = $1
  AND pos_code = ANY($2::text[]);
```

**Logic**:
- If `pos_code` exists in results → **UPDATE** operation
- If `pos_code` not in results → **CREATE** operation

**Update fields**: `title`, `department_id` (resolved from dept_code), `reports_to_id` (resolved from reports_to_pos_code), `is_manager`, `is_active`, `incumbents_count`, `updated_at`

**Create fields**: All fields plus auto-generated `id`, `created_at`

---

## Code Resolution Process

### Resolving parent_dept_code → parent_id

1. Build map of dept_code → id from import file (for departments being created)
2. Query existing departments: `SELECT id, dept_code FROM departments WHERE organization_id = $1`
3. Build map of dept_code → id from database
4. For each department with parent_dept_code:
   - Look up in import file map first
   - If not found, look up in database map
   - If still not found → Validation error

### Resolving dept_code → department_id (for positions)

1. Build map from Departments sheet in import file
2. Query existing departments by codes not in import file
3. For each position:
   - Look up dept_code in import map first
   - If not found, look up in database map
   - If still not found → Validation error

### Resolving reports_to_pos_code → reports_to_id

1. Build map of pos_code → id from import file (for positions being created)
2. Query existing positions: `SELECT id, pos_code FROM positions WHERE organization_id = $1`
3. Build map of pos_code → id from database
4. For each position with reports_to_pos_code:
   - Look up in import file map first
   - If not found, look up in database map
   - If still not found → Validation error

---

## Transaction Boundaries

### Import Transaction

```sql
BEGIN TRANSACTION;

-- Step 1: Insert/update departments (topological order if possible)
INSERT INTO departments (id, organization_id, dept_code, name, parent_id, metadata, created_at, updated_at)
VALUES ...
ON CONFLICT (organization_id, dept_code)
DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, metadata = EXCLUDED.metadata, updated_at = NOW();

-- Step 2: Insert/update positions
INSERT INTO positions (id, organization_id, department_id, pos_code, title, reports_to_id, is_manager, is_active, incumbents_count, created_at, updated_at)
VALUES ...
ON CONFLICT (organization_id, pos_code)
DO UPDATE SET title = EXCLUDED.title, department_id = EXCLUDED.department_id, reports_to_id = EXCLUDED.reports_to_id, is_manager = EXCLUDED.is_manager, is_active = EXCLUDED.is_active, incumbents_count = EXCLUDED.incumbents_count, updated_at = NOW();

COMMIT;
```

**Rollback triggers**:
- Any constraint violation
- Foreign key error
- Database connection failure
- Circular reference detected post-insert (should be caught in validation)

**Atomicity**: If any error occurs, entire transaction rolls back (no partial imports)

---

## Performance Considerations

### Batch Operations

- **Department creates**: Single INSERT with multiple VALUES rows
- **Department updates**: Single UPDATE with UNNEST for batch
- **Position creates**: Single INSERT with multiple VALUES rows
- **Position updates**: Single UPDATE with UNNEST for batch

### Expected Query Counts

For typical import (100 departments, 500 positions):
1. 1 query: Check existing departments by codes
2. 1 query: Check existing positions by codes  
3. 1 query: Batch upsert departments (ON CONFLICT)
4. 1 query: Batch upsert positions (ON CONFLICT)

**Total**: ~4 queries per import operation

### Index Usage

- Unique index on `(organization_id, dept_code)` used for upsert detection
- Unique index on `(organization_id, pos_code)` used for upsert detection
- Foreign key indexes used for reference validation

---

## State Transitions

### Import Flow State Machine

```
[Upload Started] 
     ↓
[File Uploaded to Nhost Storage] 
     ↓
[Parsing Excel] 
     ↓
[Validation Running] 
     ↓  (if errors)
[Validation Failed] → [Display Errors] → END
     ↓  (if valid)
[Preview Generated] 
     ↓
[User Confirms] 
     ↓
[Database Transaction Started] 
     ↓
[Upserting Departments] 
     ↓
[Upserting Positions] 
     ↓  (if error)
[Transaction Rolled Back] → [Display Error] → END
     ↓  (if success)
[Transaction Committed] 
     ↓
[Import Complete] → [Display Success Summary] → END
```

---

## Data Examples

### Valid Department Data

```json
[
  {
    "dept_code": "EXEC",
    "name": "Executive",
    "parent_dept_code": null,
    "metadata": {"level": 1, "cost_center": "CC-001"}
  },
  {
    "dept_code": "IT",
    "name": "Information Technology",
    "parent_dept_code": "EXEC",
    "metadata": {"level": 2}
  }
]
```

### Valid Position Data

```json
[
  {
    "pos_code": "CEO",
    "title": "Chief Executive Officer",
    "dept_code": "EXEC",
    "reports_to_pos_code": null,
    "is_manager": true,
    "is_active": true,
    "incumbents_count": 1
  },
  {
    "pos_code": "IT-DIR",
    "title": "IT Director",
    "dept_code": "IT",
    "reports_to_pos_code": "CEO",
    "is_manager": true,
    "is_active": true,
    "incumbents_count": 1
  }
]
```

---

## Summary

This data model supports:
- ✅ Upsert operations based on human-readable codes
- ✅ Hierarchical relationships (departments, positions)
- ✅ Comprehensive validation with specific error reporting
- ✅ Transactional integrity (all-or-nothing imports)
- ✅ Performance optimization via batch operations
- ✅ Flexible metadata storage (jsonb)
- ✅ Bilingual error messages (EN/TR via translation keys)

**Ready for contract definition and implementation.**
