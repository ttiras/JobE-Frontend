# UI Reflection Fix - File Processing Debug

## Problem
File was being parsed successfully but UI wasn't updating to show the preview data (Step 2).

## Root Cause Analysis

### Issue 1: Race Condition
When `initialFile` is provided, the code was calling:
```typescript
uploadFile(arrayBuffer, fileName)  // Sets context with fileBuffer
await parseFile(importType)        // Reads context.fileBuffer
```

However, `uploadFile` sets React state asynchronously. The `parseFile` call was executing before the context update propagated, so `context.fileBuffer` was still undefined.

### Issue 2: Auto-Advance Logic
The wizard's auto-advance useEffect was checking:
```typescript
if (context.state === ImportWorkflowState.PREVIEW && currentStep === 1)
```

But when `initialFile` is provided, we start at `currentStep = 2`, so this condition never triggered.

## Solution Implemented

### 1. Split File Processing into Two useEffects

**First useEffect - Upload File:**
```typescript
useEffect(() => {
  if (initialFile && !context.fileBuffer && context.state === ImportWorkflowState.IDLE) {
    const processInitialFile = async () => {
      const arrayBuffer = await initialFile.arrayBuffer()
      uploadFile(arrayBuffer, initialFile.name)  // Sets fileBuffer in context
    }
    processInitialFile()
  }
}, [initialFile, context.fileBuffer, context.state, uploadFile])
```

**Second useEffect - Auto-Parse When Buffer is Ready:**
```typescript
useEffect(() => {
  if (initialFile && context.fileBuffer && context.state === ImportWorkflowState.UPLOADING) {
    parseFile(importType)  // Now fileBuffer is guaranteed to exist
  }
}, [initialFile, context.fileBuffer, context.state, importType, parseFile])
```

This ensures `parseFile` only runs **after** the context has been updated with the `fileBuffer`.

### 2. Fixed Auto-Advance Logic

Changed from:
```typescript
if (context.state === ImportWorkflowState.PREVIEW && currentStep === 1)
```

To:
```typescript
if (context.state === ImportWorkflowState.PREVIEW && currentStep <= 2)
```

This allows the wizard to respond to PREVIEW state when starting at step 2.

### 3. Added Comprehensive Console Logging

Added debug logs to track the entire flow:

**In ImportWizard:**
- `'Processing initial file: {filename}'`
- `'File read as ArrayBuffer, size: {bytes}'`
- `'FileBuffer detected, parsing with importType: {type}'`

**In useImportWorkflow.parseFile:**
- `'parseFile called with type: {type}'`
- `'context.fileBuffer exists: {boolean}'`
- `'Setting state to PARSING'`
- `'Calling parseExcelImport with type: {type}'`
- `'Parsed data: { departments: X, positions: Y }'`
- `'Setting PREVIEW state with summary: {summary}'`
- `'Validation status: {status}'`
- `'Errors count: {count}'`
- `'PREVIEW state set successfully'`

## Expected Console Output (Success)

When you drop a departments Excel file, you should see:

```
Processing initial file: departments.xlsx
File read as ArrayBuffer, size: 12345
FileBuffer detected, parsing with importType: departments
parseFile called with type: departments
context.fileBuffer exists: true
Setting state to PARSING
Calling parseExcelImport with type: departments
Parsed data: { departments: 3, positions: 0 }
Setting PREVIEW state with summary: { totalRecords: 3, ... }
Validation status: VALID
Errors count: 0
PREVIEW state set successfully
```

Then the UI should automatically show Step 2 with the preview data.

## Expected Console Output (Error)

If column names are wrong:

```
Processing initial file: departments.xlsx
File read as ArrayBuffer, size: 12345
FileBuffer detected, parsing with importType: departments
parseFile called with type: departments
context.fileBuffer exists: true
Setting state to PARSING
Calling parseExcelImport with type: departments
Parse exception: Error: Missing required columns in Departments sheet: dept_code, name
```

## Testing Checklist

1. ✅ Open browser console (F12)
2. ✅ Navigate to `/dashboard/{orgId}/org-structure/departments/import`
3. ✅ Drop an Excel file with columns: `dept_code`, `name`, `parent_dept_code`
4. ✅ Watch console for logs
5. ✅ UI should show "Step 2: Veri Önizleme ve Doğrulama"
6. ✅ Should show statistics: "X Departmanlar, 0 Yeni"
7. ✅ Should show table with your department data

## Files Modified

1. `/components/import/import-wizard.tsx`
   - Split initial file processing into two useEffects
   - Fixed auto-advance logic to work with step 2 start
   - Added console.log statements

2. `/hooks/useImportWorkflow.ts`
   - Added extensive console logging in `parseFile`
   - Log when PREVIEW state is set
   - Log parsed data counts and validation results

## Debugging Tips

If UI still doesn't update:

1. **Check console for logs** - Should see the full sequence
2. **Check if parsing completed** - Look for "PREVIEW state set successfully"
3. **Check React DevTools** - Inspect ImportWizard component state
   - `currentStep` should be 2
   - `context.state` should be `PREVIEW`
   - `context.preview` should have data
4. **Check column names** - Must be exact: `dept_code`, `name`, `parent_dept_code`

## Next Steps

After testing with console logs:
- If successful, we can remove the debug logging
- If issues persist, the logs will tell us exactly where the flow breaks

---

**Status**: 🔍 Debug Ready  
**Action Required**: Test with browser console open  
**Expected**: Full log sequence ending with "PREVIEW state set successfully"
