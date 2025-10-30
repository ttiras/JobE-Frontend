# Fix: Consistent Empty Parent Code Handling

## Problem Identified

The validation was **inconsistent** in handling empty parent codes:

### Before (Inconsistent):
```
Excel file with parent_dept_code = "-"

❌ INVALID_REFERENCE: Parent department '-' does not exist
❌ BUSINESS_RULE: No root department found - all departments have a parent
```

**The issue:**
- `dept.parent_dept_code = "-"` was treated as a **string value** to validate
- But also treated as **not empty** for hierarchy detection
- This caused conflicting errors

## Root Cause

Different validation functions were checking for "empty parent" differently:

**Reference Validation:**
```typescript
if (dept.parent_dept_code && !validDeptCodes.has(dept.parent_dept_code)) {
  // Error: '-' is truthy, tries to find it
}
```

**Hierarchy Validation:**
```typescript
const rootDepartments = departments.filter(
  dept => !dept.parent_dept_code || dept.parent_dept_code.trim() === ''
);
// '-' doesn't match either condition, so CORP is not considered a root
```

**Circular Reference:**
```typescript
if (parentCode) {
  // '-' is truthy, adds to adjacency list
}
```

## Solution Implemented

### 1. Centralized Empty Check Function

Created a single helper function to determine if a parent code is "empty":

```typescript
/**
 * Check if a parent code value is considered empty/null
 */
function isEmptyParentCode(parentCode: string | null | undefined): boolean {
  if (!parentCode) return true;
  const trimmed = parentCode.trim();
  // Consider empty, "-", or whitespace as empty parent (root department)
  return trimmed === '' || trimmed === '-';
}
```

This treats the following as "no parent" (root department):
- `null`
- `undefined`
- `""` (empty string)
- `" "` (whitespace)
- `"-"` (hyphen/dash)

### 2. Updated All Validations to Use Helper

**Reference Validation:**
```typescript
export function validateDepartmentReferences(
  departments: DepartmentRow[],
  validDeptCodes: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  departments.forEach(dept => {
    // Skip validation if parent is empty or "-"
    if (!isEmptyParentCode(dept.parent_dept_code) && !validDeptCodes.has(dept.parent_dept_code!)) {
      errors.push({
        type: ErrorType.INVALID_REFERENCE,
        severity: ErrorSeverity.ERROR,
        message: `Parent department '${dept.parent_dept_code}' does not exist`,
        // ...
      });
    }
  });

  return errors;
}
```

**Hierarchy Validation:**
```typescript
export function validateDepartmentHierarchy(
  departments: DepartmentRow[]
): ValidationError[] {
  // Find all root departments (no parent or parent is "-")
  const rootDepartments = departments.filter(dept => isEmptyParentCode(dept.parent_dept_code));
  // ...
}
```

**Circular Reference Detection:**
```typescript
items.forEach(item => {
  const code = getCode(item);
  const parentCode = getParentCode(item);
  itemMap.set(code, item);
  
  // Only add to adjacency list if parent is not empty/null
  if (parentCode && !isEmptyParentCode(parentCode)) {
    adjacencyList.set(code, parentCode);
  }
});
```

### 3. Normalize in Parser

Updated parser to convert "-" to null immediately:

```typescript
return jsonData.map((row, index) => {
  return {
    dept_code: String(row.dept_code || '').trim(),
    name: String(row.name || '').trim(),
    parent_dept_code: row.parent_dept_code 
      ? String(row.parent_dept_code).trim() 
      : null,
    metadata,
    excelRow,
  };
}).map(dept => {
  // Normalize empty parent codes: treat "-" and empty strings as null
  if (!dept.parent_dept_code || dept.parent_dept_code === '-' || dept.parent_dept_code === '') {
    return { ...dept, parent_dept_code: null };
  }
  return dept;
});
```

## Expected Behavior Now

### Example 1: Root Department with "-"
```excel
dept_code,name,parent_dept_code
CORP,Corporate,-
IT,IT Department,CORP
HR,HR Department,CORP
```

**Result:**
- ✅ No INVALID_REFERENCE error for "-"
- ✅ CORP is recognized as root department
- ✅ No "No root department found" error
- ✅ Hierarchy validation passes

### Example 2: Root Department with Empty
```excel
dept_code,name,parent_dept_code
CORP,Corporate,
IT,IT Department,CORP
HR,HR Department,CORP
```

**Result:**
- ✅ CORP is recognized as root department
- ✅ Same behavior as "-"

### Example 3: Multiple Roots
```excel
dept_code,name,parent_dept_code
CORP,Corporate,-
IT,IT Department,
HR,HR Department,CORP
```

**Result:**
- ⚠️ WARNING: Multiple root departments found (2): CORP, IT
- ✅ Can proceed with import

### Example 4: Invalid Reference
```excel
dept_code,name,parent_dept_code
CORP,Corporate,INVALID
IT,IT Department,CORP
```

**Result:**
- ❌ ERROR: Parent department 'INVALID' does not exist
- ✅ Correctly identifies actual invalid reference

## Files Modified

1. **`/lib/utils/excel/validator.ts`**
   - Added `isEmptyParentCode()` helper function
   - Updated `validateDepartmentReferences()` to use helper
   - Updated `validateDepartmentHierarchy()` to use helper
   - Updated `validateCircularReferences()` to use helper

2. **`/lib/utils/excel/parser.ts`**
   - Added normalization step to convert "-" to null
   - Ensures consistency from the source

## Benefits

✅ **Consistent Logic**: All validations use same "empty check"  
✅ **Clear Intent**: Users can use "-" or leave empty for root departments  
✅ **No Conflicts**: Won't see contradictory error messages  
✅ **Normalized Data**: Parser converts "-" to null immediately  
✅ **Maintainable**: Single source of truth for "empty parent" logic  

## Testing

### Test Case 1: Single Root with "-"
```excel
dept_code,name,parent_dept_code
ROOT,Root Dept,-
CHILD,Child Dept,ROOT
```
✅ Expected: No errors, import succeeds

### Test Case 2: Multiple Roots (mixed "-" and empty)
```excel
dept_code,name,parent_dept_code
ROOT1,Root 1,-
ROOT2,Root 2,
CHILD,Child,ROOT1
```
⚠️ Expected: Warning about 2 root departments, can proceed

### Test Case 3: All Have Parents (none are "-" or empty)
```excel
dept_code,name,parent_dept_code
A,Dept A,B
B,Dept B,C
C,Dept C,A
```
❌ Expected: Error - No root department found, circular reference detected

---

**Status**: ✅ Fixed  
**Breaking Changes**: None  
**Impact**: Resolves inconsistent validation errors
