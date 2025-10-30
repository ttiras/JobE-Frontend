# Position Import Schema Update

## Overview
Updated the position import functionality to match the correct database schema. Removed the `is_active` field and ensured proper handling of `reports_to_id` (UUID) field with user-friendly position code references in Excel files.

## Database Schema
As per the actual database structure:
```sql
positions:
- pos_code: text
- title: text  
- dept_code: text (references department)
- reports_to_id: uuid, nullable (references position ID, not position code)
- is_manager: boolean, default: false
- incumbents_count: integer, default: 1
```

**Note**: Positions table does NOT have an `is_active` field.

## Excel File Format
Users upload Excel files with the following columns:

```
pos_code | title | dept_code | reports_to_pos_code | is_manager | incumbents_count
```

### Key Points:
1. **reports_to_pos_code**: Users provide position CODE (not UUID) for better usability
2. **is_active**: Removed from Excel template (doesn't exist in DB)
3. **dept_code**: Department code that gets resolved to department_id during import
4. **is_manager**: Boolean field (true/false, yes/no, 1/0)
5. **incumbents_count**: Integer, defaults to 1 if not provided

## Code References Resolution

Similar to how departments handle `parent_dept_code` → `parent_id`:

### During Import:
1. Excel contains user-friendly codes:
   - `dept_code` (e.g., "HR", "IT")
   - `reports_to_pos_code` (e.g., "POS-001")

2. Import process resolves codes to UUIDs:
   ```typescript
   // Build code-to-ID mappings
   const deptCodeToId = new Map<string, string>();
   const posCodeToId = new Map<string, string>();
   
   // Resolve during insert
   {
     department_id: deptCodeToId.get(pos.dept_code) || null,
     reports_to_id: pos.reports_to_pos_code 
       ? posCodeToId.get(pos.reports_to_pos_code) || null 
       : null
   }
   ```

3. Database stores UUIDs:
   - `department_id`: UUID reference
   - `reports_to_id`: UUID reference

## Changes Made

### 1. Type Definitions (`lib/types/import.ts`)
- **PositionRow**: Kept `reports_to_pos_code` (user input), removed `is_active`
- **PositionPreview**: Kept `reports_to_pos_code` (for preview), removed `is_active`

### 2. Excel Parser (`lib/utils/excel/parser.ts`)
- Updated `POSITION_COLUMNS` array to remove `is_active`
- Updated `parsePositionSheet` to parse `reports_to_pos_code` (not reports_to_id)
- Removed `is_active` parsing logic

### 3. GraphQL Mutations (`lib/nhost/graphql/mutations/positions.ts`)
- `INSERT_POSITIONS`: Returns `reports_to_id` (UUID), removed `is_active`
- `INSERT_POSITION`: Returns `reports_to_id` (UUID), removed `is_active`
- `UPDATE_POSITIONS_BULK`: Returns `reports_to_id` (UUID), removed `is_active`
- `UPDATE_POSITION`: Returns `reports_to_id` (UUID), removed `is_active`
- `UPSERT_POSITIONS`: Returns `reports_to_id` (UUID), removed `is_active`

### 4. Import Actions (`lib/actions/import.ts`)
- Position CREATE: Resolves `reports_to_pos_code` to `reports_to_id` UUID
- Position UPDATE: Resolves `reports_to_pos_code` to `reports_to_id` UUID
- Removed all `is_active` field handling

### 5. Import Workflow (`lib/nhost/graphql/mutations/import-workflow.ts`)
- Removed `is_active` from position insert data
- Removed `is_active` from position update changes
- (Note: This file is deprecated but updated for consistency)

### 6. Upsert Detector (`lib/utils/excel/upsert-detector.ts`)
- Removed `is_active` from `detectPositionOperations` mapping

### 7. UI Components (`components/import/data-preview-table.tsx`)
- Removed "Active" column from positions preview table
- Added "Is Manager" and "Incumbents" columns
- Updated table headers and cell rendering

## Validation

The validation logic continues to work correctly:
- Validates `dept_code` references exist
- Validates `reports_to_pos_code` references exist  
- Detects circular reporting relationships
- Ensures required fields are present

## Testing Required

Update or remove these test files (they reference `is_active`):
- `tests/unit/excel/parser.test.ts`
- `tests/unit/excel/validator.test.ts`  
- `tests/integration/import/upload-flow.test.ts`

## Example Excel Data

```
pos_code    | title              | dept_code | reports_to_pos_code | is_manager | incumbents_count
POS-001     | CEO                | EXEC      |                     | true       | 1
POS-002     | VP Engineering     | ENG       | POS-001             | true       | 1
POS-003     | Senior Engineer    | ENG       | POS-002             | false      | 3
POS-004     | Engineer           | ENG       | POS-002             | false      | 5
```

## Database Insert Example

After resolution, the data becomes:
```typescript
{
  pos_code: "POS-003",
  title: "Senior Engineer",
  department_id: "123e4567-e89b-12d3-a456-426614174001", // Resolved from "ENG"
  reports_to_id: "123e4567-e89b-12d3-a456-426614174002", // Resolved from "POS-002"  
  is_manager: false,
  incumbents_count: 3
}
```

## Benefits

1. **User-Friendly**: Users work with memorable codes instead of UUIDs
2. **Data Integrity**: Database uses proper foreign key references (UUIDs)
3. **Validation**: Can validate references before import
4. **Flexibility**: Easy to update reporting structure via Excel
5. **Correct Schema**: Matches actual database schema (no is_active field)

## Migration Notes

If there are existing Excel templates or documentation referencing `is_active`:
- Remove `is_active` column from all templates
- Update user documentation  
- Update example files
- Update spec documents

The `reports_to_pos_code` approach is already correct and matches the department pattern.
