# Department Hierarchy Validation - Nullable Parent Support

## Business Requirement

Organizations typically have a hierarchical structure:
- **One top-level department** (e.g., "Genel Müdürlük") with NO parent
- **Child departments** that connect to the hierarchy through `parent_dept_code`

### Example:
```
Genel Müdürlük (parent: null)
  ├─ IT (parent: Genel Müdürlük)
  │   ├─ IT-DEV (parent: IT)
  │   └─ IT-OPS (parent: IT)
  └─ HR (parent: Genel Müdürlük)
      ├─ HR-REC (parent: HR)
      └─ HR-PAY (parent: HR)
```

## Changes Implemented

### 1. Added Business Rule Validation

**New Function: `validateDepartmentHierarchy()`**

This validates the organizational structure and provides warnings:

#### Case 1: Multiple Root Departments (Warning)
```typescript
// If user uploads:
// - Genel Müdürlük (parent: null)
// - IT (parent: null)
// - HR (parent: null)

⚠️ WARNING: Multiple root departments found (3): Genel Müdürlük, IT, HR
Suggestion: Typically, there should be one top-level department (e.g., "Genel Müdürlük"). 
You can proceed as is or connect departments to a single root.
```

**User can choose to:**
- ✅ Proceed with multiple roots (import will continue)
- 📝 Fix the Excel file to connect to single root

#### Case 2: No Root Departments (Error)
```typescript
// If ALL departments have a parent:
// - IT (parent: HR)
// - HR (parent: Finance)
// - Finance (parent: IT)  // Circular!

❌ ERROR: No root department found - all departments have a parent
Suggestion: At least one department should have no parent (root department). 
Check for circular references.
```

**Import blocked:** User must fix this before proceeding.

### 2. Updated Error Types

Added new error type to `/lib/types/import.ts`:

```typescript
export enum ErrorType {
  // ... existing types
  BUSINESS_RULE = 'BUSINESS_RULE', // Business logic warnings
}
```

This allows us to distinguish between:
- **Data errors** (missing fields, invalid references) → `ERROR` severity
- **Business logic warnings** (multiple roots) → `WARNING` severity

### 3. Updated Validation Flow

Modified `/lib/utils/excel/validator.ts`:

```typescript
export function validateDepartments(context: ValidationContext): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Required fields (dept_code, name)
  errors.push(...validateDepartmentRequiredFields(context.departments));

  // 2. Duplicate codes
  errors.push(...validateDuplicateDepartmentCodes(context.departments));

  // 3. Parent references exist
  errors.push(...validateDepartmentReferences(context.departments, context.validDepartmentCodes));

  // 4. ⭐ NEW: Hierarchy structure (multiple roots warning)
  errors.push(...validateDepartmentHierarchy(context.departments));

  // 5. Circular references
  errors.push(...validateCircularReferences(...));

  return errors;
}
```

### 4. Parent Code Nullability

The parser already correctly handles nullable parent codes:

```typescript
return {
  dept_code: String(row.dept_code || '').trim(),
  name: String(row.name || '').trim(),
  parent_dept_code: row.parent_dept_code 
    ? String(row.parent_dept_code).trim() 
    : null,  // ✅ Nullable
  metadata,
  excelRow,
};
```

## Validation Rules Summary

| Scenario | Number of Roots | Severity | Can Import? |
|----------|----------------|----------|-------------|
| One root department | 1 | ✅ Valid | Yes |
| Multiple root departments | 2+ | ⚠️ Warning | Yes, with warning |
| No root departments | 0 | ❌ Error | No |

## Example Excel Files

### ✅ Valid (One Root)
```
dept_code          | name              | parent_dept_code
-------------------|-------------------|------------------
GENEL              | Genel Müdürlük   | 
IT                 | IT Department    | GENEL
IT-DEV             | Development      | IT
HR                 | HR Department    | GENEL
```
→ No warnings, import proceeds

### ⚠️ Warning (Multiple Roots)
```
dept_code          | name              | parent_dept_code
-------------------|-------------------|------------------
GENEL              | Genel Müdürlük   | 
IT                 | IT Department    | 
HR                 | HR Department    | 
IT-DEV             | Development      | IT
```
→ Warning shown, user can proceed or fix

### ❌ Error (No Roots - Circular)
```
dept_code          | name              | parent_dept_code
-------------------|-------------------|------------------
IT                 | IT Department    | HR
HR                 | HR Department    | Finance
Finance            | Finance Dept     | IT
```
→ Error shown, import blocked

## User Experience

### In the Import Wizard Step 2:

**Multiple Roots Warning:**
```
⚠️ Uyarı: Çoklu Kök Departman

Birden fazla kök departman bulundu (3): GENEL, IT, HR

Genellikle tek bir üst düzey departman olmalıdır (örn: "Genel Müdürlük"). 
Departmanları tek bir köke bağlayabilir veya olduğu gibi devam edebilirsiniz.

[Düzelt] [Devam Et]
```

**No Root Error:**
```
❌ Hata: Kök Departman Bulunamadı

Tüm departmanların bir üst departmanı var. En az bir departmanın 
üst departmanı olmamalıdır (kök departman).

Döngüsel referanslar için kontrol edin.

[Geri Dön]
```

## Technical Details

### Validation Logic

```typescript
export function validateDepartmentHierarchy(
  departments: DepartmentRow[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Find root departments (no parent)
  const rootDepartments = departments.filter(
    dept => !dept.parent_dept_code || dept.parent_dept_code.trim() === ''
  );

  // Multiple roots → WARNING
  if (rootDepartments.length > 1) {
    const rootCodes = rootDepartments.map(d => d.dept_code).join(', ');
    errors.push({
      type: ErrorType.BUSINESS_RULE,
      severity: ErrorSeverity.WARNING,  // ⚠️ Warning, not error
      message: `Multiple root departments found (${rootDepartments.length}): ${rootCodes}`,
      suggestion: 'Typically, there should be one top-level department...',
      // ...
    });
  }

  // No roots → ERROR
  if (rootDepartments.length === 0 && departments.length > 0) {
    errors.push({
      type: ErrorType.BUSINESS_RULE,
      severity: ErrorSeverity.ERROR,  // ❌ Error, blocks import
      message: 'No root department found - all departments have a parent',
      suggestion: 'At least one department should have no parent...',
      // ...
    });
  }

  return errors;
}
```

### Import Behavior

- **Warnings (`WARNING` severity)**: User sees warning but can continue import
- **Errors (`ERROR` severity)**: Import button disabled, user must fix

## Files Modified

1. `/lib/types/import.ts`
   - Added `BUSINESS_RULE` to `ErrorType` enum

2. `/lib/utils/excel/validator.ts`
   - Added `validateDepartmentHierarchy()` function
   - Updated `validateDepartments()` to include hierarchy validation
   - Updated `validateDepartmentReferences()` comment to clarify nullable parent

3. `/lib/utils/excel/parser.ts`
   - Already correctly handles nullable `parent_dept_code`

## Testing Scenarios

### Test 1: Single Root (Expected: No warnings)
```excel
dept_code,name,parent_dept_code
GENEL,Genel Müdürlük,
IT,IT Department,GENEL
```
✅ Import succeeds without warnings

### Test 2: Multiple Roots (Expected: Warning, can proceed)
```excel
dept_code,name,parent_dept_code
GENEL,Genel Müdürlük,
IT,IT Department,
HR,HR Department,
```
⚠️ Warning displayed, user can proceed

### Test 3: No Roots (Expected: Error, cannot proceed)
```excel
dept_code,name,parent_dept_code
IT,IT Department,HR
HR,HR Department,IT
```
❌ Error displayed, import blocked

## Benefits

✅ **Flexible**: Allows single root (best practice) or multiple roots (user choice)  
✅ **Guided**: Warns users about unusual patterns  
✅ **Safe**: Blocks imports with no roots (likely circular references)  
✅ **Clear**: Provides actionable suggestions  
✅ **Non-breaking**: Warnings don't block imports, only errors do  

---

**Status**: ✅ Complete  
**Breaking Changes**: None  
**User Impact**: Better guidance on organizational hierarchy structure
