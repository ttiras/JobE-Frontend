# Phase 0: Research & Technical Decisions

**Feature**: Excel Import for Departments and Positions  
**Date**: October 29, 2025  
**Status**: Complete

## Research Tasks

### 1. Excel Parsing Library Selection

**Decision**: Use **`xlsx`** (SheetJS Community Edition)

**Rationale**:
- Most popular and mature JavaScript/TypeScript Excel parsing library (~30M weekly downloads)
- Works in both browser and Node.js environments (flexibility for client/server-side parsing)
- Supports .xlsx and .xls formats (meets FR-001 requirement)
- Zero native dependencies (pure JavaScript, easy to deploy)
- Strong TypeScript support with @types/xlsx
- Active maintenance and extensive documentation
- Battle-tested in production by thousands of projects
- MIT licensed (permissive for commercial use)

**Alternatives Considered**:
- **exceljs**: More feature-rich but heavier (~500KB vs ~200KB minified), unnecessary complexity for read-only parsing
- **papaparse**: CSV-only, doesn't support multi-sheet Excel files (requirement includes Departments and Positions sheets)
- **node-xlsx**: Thin wrapper around xlsx, no additional value
- **Luckysheet**: Full spreadsheet editor, massive overkill for simple import feature

**Installation**: `pnpm add xlsx @types/xlsx`

**Usage Pattern**:
```typescript
import * as XLSX from 'xlsx';

// Read file from upload
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

// Access sheets
const deptSheet = workbook.Sheets['Departments'];
const posSheet = workbook.Sheets['Positions'];

// Convert to JSON
const departments = XLSX.utils.sheet_to_json(deptSheet);
const positions = XLSX.utils.sheet_to_json(posSheet);
```

---

### 2. File Upload Strategy with Nhost

**Decision**: **Server-side processing** using Nhost File Storage + GraphQL Functions

**Rationale**:
- Nhost File Storage provides secure, authenticated file uploads with built-in URL generation
- Server-side parsing ensures consistent validation across all clients
- Security: validation logic cannot be bypassed by client manipulation
- Performance: server has more resources for parsing large files
- Transactions: database operations can be wrapped in PostgreSQL transactions
- RBAC enforcement happens server-side via Hasura permissions
- Aligns with clarification: "Use Nhost upload function (server-side processing)"

**Architecture Flow**:
1. **Client**: User selects file → Upload to Nhost File Storage via `@nhost/nextjs` SDK
2. **Nhost Storage**: File saved, returns file ID and URL
3. **Client**: Call GraphQL mutation with file ID
4. **Hasura Action/Function**: 
   - Download file from Nhost Storage using file ID
   - Parse Excel using `xlsx` library
   - Validate data (circular refs, uniqueness, references)
   - Preview response sent to client
5. **Client**: Display preview, user confirms
6. **Hasura Action/Function**: Execute upsert operations in transaction

**Nhost SDK Usage**:
```typescript
import { useFileUpload } from '@nhost/nextjs';

const { upload, isUploading, progress } = useFileUpload();

const handleUpload = async (file: File) => {
  const { fileMetadata, error } = await upload({ file });
  if (error) throw error;
  
  // Call GraphQL mutation with fileMetadata.id
  const result = await client.mutate({
    mutation: PARSE_IMPORT_FILE,
    variables: { fileId: fileMetadata.id }
  });
};
```

**Alternatives Considered**:
- **Client-side parsing**: Rejected due to security concerns (validation bypass), consistency issues across browsers, inability to enforce server-side transactions
- **Direct multipart upload to GraphQL**: Nhost File Storage provides better file management, CDN distribution, and access control

---

### 3. Validation Strategy for Circular References

**Decision**: **Graph-based cycle detection** using Depth-First Search (DFS)

**Rationale**:
- Circular references in hierarchies (departments, reporting relationships) are graph cycles
- DFS is efficient for cycle detection: O(V + E) time complexity
- Can detect and report all cycles in a single pass
- Well-understood algorithm with clear implementation patterns
- Provides detailed path information for error messages (which nodes form the cycle)

**Algorithm**:
```typescript
function detectCircularReferences(
  nodes: Array<{ code: string; parent_code: string | null }>,
  relationship: 'parent' | 'reports_to'
): CircularRefError[] {
  const graph = buildGraph(nodes, relationship);
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]): boolean {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    for (const neighbor of graph.get(node) || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path])) return true;
      } else if (recursionStack.has(neighbor)) {
        // Cycle detected
        cycles.push([...path, neighbor]);
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles.map(cycle => ({
    type: 'circular_reference',
    path: cycle.join(' → '),
    codes: cycle
  }));
}
```

**Alternatives Considered**:
- **Union-Find**: Good for detecting cycles but doesn't provide cycle paths for error messages
- **Topological Sort**: Can detect cycles but requires more memory and doesn't identify all cycles clearly
- **Breadth-First Search**: Less efficient for cycle detection than DFS

---

### 4. Upsert Detection Pattern

**Decision**: **Code-based matching with explicit update tracking**

**Rationale**:
- dept_code and pos_code are unique within organization (FR-011)
- Query existing records by codes in single batch operation
- Separate records into "create" and "update" sets based on existence
- Provides clear preview showing user which records will be created vs updated (FR-020)
- Enables transactional processing with clear rollback semantics

**Implementation Pattern**:
```typescript
async function detectUpsertOperations(
  importData: Department[],
  organizationId: string
): Promise<UpsertPlan> {
  const codes = importData.map(d => d.dept_code);
  
  // Single batch query for existing departments
  const existing = await db.departments
    .where({ organization_id: organizationId, dept_code: { _in: codes } })
    .select(['dept_code', 'id']);
  
  const existingCodes = new Set(existing.map(d => d.dept_code));
  
  const creates = importData.filter(d => !existingCodes.has(d.dept_code));
  const updates = importData.filter(d => existingCodes.has(d.dept_code));
  
  return {
    creates: creates.map(d => ({ ...d, operation: 'create' })),
    updates: updates.map(d => ({
      ...d,
      operation: 'update',
      existingId: existing.find(e => e.dept_code === d.dept_code)!.id
    })),
    summary: {
      total: importData.length,
      creates: creates.length,
      updates: updates.length
    }
  };
}
```

**Alternatives Considered**:
- **PostgreSQL UPSERT (ON CONFLICT)**: Doesn't provide preview of what will be updated vs created
- **Optimistic approach**: Check after attempt, increases complexity and transaction time
- **UUID-based matching**: User-unfriendly, violates clarification decision to use codes

---

### 5. Row Processing and Error Reporting

**Decision**: **Fail-fast validation with detailed error accumulation**

**Rationale**:
- Collect all validation errors before reporting (don't stop at first error)
- Users can fix multiple issues in one edit cycle
- Errors include row number, column name, specific issue, and suggested fix
- Blank row handling: skip completely empty rows silently (FR-018), error on partial data
- Row numbers in errors match Excel row numbers (1-indexed, accounting for header row)

**Error Structure**:
```typescript
interface ValidationError {
  row: number;              // Excel row number (1-indexed)
  column?: string;          // Column name (e.g., "dept_code", "parent_dept_code")
  type: ErrorType;          // 'missing_required' | 'duplicate_code' | 'invalid_reference' | 'circular_ref' | 'invalid_format'
  message: string;          // Human-readable error
  suggestion?: string;      // How to fix (e.g., "Ensure this code exists in Departments sheet")
  affectedCodes?: string[]; // For circular refs, list all codes involved
}
```

**Validation Order** (fail-fast by severity):
1. File format validation (is it .xlsx/.xls?)
2. Sheet existence (at least one of Departments/Positions - FR-007)
3. Required columns presence (FR-008, FR-009)
4. Row-level required field validation
5. Code uniqueness within import file
6. Code uniqueness against existing data (for creates)
7. Reference validation (parent_dept_code, dept_code, reports_to_pos_code exist)
8. Circular reference detection
9. Data type validation (booleans, integers)
10. Metadata JSON validation

**Blank Row Handling**:
```typescript
function isBlankRow(row: any): boolean {
  return Object.values(row).every(value => 
    value === null || value === undefined || String(value).trim() === ''
  );
}

const validRows = rows.filter((row, index) => {
  if (isBlankRow(row)) {
    return false; // Skip silently
  }
  if (hasPartialData(row) && !hasRequiredFields(row)) {
    errors.push({
      row: index + 2, // +2 for header row and 1-indexing
      type: 'missing_required',
      message: 'Row has some data but missing required fields'
    });
    return false;
  }
  return true;
});
```

**Alternatives Considered**:
- **Stop at first error**: Poor UX, requires multiple upload cycles
- **Row-by-row validation**: Less efficient than batch validation
- **Skip all errors**: Dangerous, could import invalid data

---

### 6. Template Generation

**Decision**: **Pre-generated static template with example data**

**Rationale**:
- Template structure is fixed (departments and positions sheets with defined columns)
- Static file is faster to download (no generation delay)
- Can be versioned and tested
- Example data provides clear guidance
- Simpler implementation (no runtime Excel generation needed)

**Template Structure**:

**Departments Sheet**:
| dept_code | name | parent_dept_code | metadata |
|-----------|------|------------------|----------|
| EXEC | Executive | | {"level": 1} |
| HR | Human Resources | EXEC | {"level": 2} |
| IT | Information Technology | EXEC | {"level": 2} |
| IT-DEV | IT Development | IT | {"level": 3} |

**Positions Sheet**:
| pos_code | title | dept_code | reports_to_pos_code | is_manager | is_active | incumbents_count |
|----------|-------|-----------|---------------------|------------|-----------|------------------|
| CEO | Chief Executive Officer | EXEC | | TRUE | TRUE | 1 |
| HR-DIR | HR Director | HR | CEO | TRUE | TRUE | 1 |
| IT-DIR | IT Director | IT | CEO | TRUE | TRUE | 1 |
| IT-DEV-MGR | Development Manager | IT-DEV | IT-DIR | TRUE | TRUE | 1 |
| IT-DEV-01 | Senior Developer | IT-DEV | IT-DEV-MGR | FALSE | TRUE | 3 |

**File Location**: `/public/templates/departments-positions-template.xlsx`

**Download Implementation**:
```typescript
export function TemplateDownload() {
  return (
    <a
      href="/templates/departments-positions-template.xlsx"
      download="departments-positions-template.xlsx"
      className="..."
    >
      Download Template
    </a>
  );
}
```

**Alternatives Considered**:
- **Runtime generation**: Unnecessary complexity, slower, no benefit over static file
- **CSV templates**: Doesn't support multi-sheet structure (need Departments + Positions in one file)
- **JSON/XML**: Less familiar to HR users than Excel

---

### 7. Internationalization (i18n) for Import UI

**Decision**: **Use existing next-intl infrastructure** with import-specific translation keys

**Rationale**:
- Project already uses next-intl ^4.4.0 for English and Turkish
- Consistent with existing codebase patterns
- Import UI needs translations for: instructions, column labels, error messages, button labels, success messages
- Error messages need to be clear and actionable in both languages

**Translation Keys Structure**:
```json
// messages/en.json
{
  "import": {
    "title": "Import Departments and Positions",
    "upload": {
      "dropzone": "Drag and drop your Excel file here, or click to select",
      "maxSize": "Maximum file size: 5MB",
      "supportedFormats": "Supported formats: .xlsx, .xls"
    },
    "template": {
      "download": "Download Template",
      "description": "Download a pre-filled example showing the correct structure"
    },
    "validation": {
      "errors": "Validation Errors",
      "errorCount": "{count} errors found",
      "row": "Row {number}",
      "missingRequired": "Missing required field: {field}",
      "duplicateCode": "Duplicate code: {code}",
      "invalidReference": "{field} references non-existent {type}: {code}",
      "circularReference": "Circular reference detected: {path}"
    },
    "preview": {
      "title": "Preview Import",
      "summary": "{createCount} new records, {updateCount} updates",
      "departments": "Departments",
      "positions": "Positions"
    },
    "confirmation": {
      "title": "Confirm Import",
      "message": "This will create {createCount} and update {updateCount} records. Continue?",
      "cancel": "Cancel",
      "confirm": "Import"
    },
    "success": {
      "title": "Import Successful",
      "message": "Imported {departmentCount} departments and {positionCount} positions"
    }
  }
}
```

**Error Message Localization**:
- All validation errors must use translation keys
- Dynamic values (row numbers, codes, field names) passed as parameters
- Keep technical field names in English (dept_code, pos_code) for consistency with database

**Alternatives Considered**:
- **Hard-coded English only**: Violates constitution requirement for EN/TR support
- **Separate i18n library**: Inconsistent with existing project infrastructure

---

### 8. Access Control (RBAC) Enforcement

**Decision**: **Server-side permission check using Hasura role-based permissions**

**Rationale**:
- Nhost/Hasura provides built-in RBAC via JWT claims and role system
- Import mutations protected by `x-hasura-allowed-roles` header
- Role check happens before any processing (fail early)
- UI layer hides import page for read-only users (progressive disclosure)
- Defense in depth: client-side hiding + server-side enforcement

**Permission Pattern**:
```graphql
# Hasura permission rule (in metadata)
mutation: {
  import_departments_positions: {
    check: {
      organization: {
        members: {
          user_id: { _eq: "X-Hasura-User-Id" },
          role: { _in: ["admin", "write"] }
        }
      }
    }
  }
}
```

**Client-side Role Check**:
```typescript
import { useAuthenticationStatus, useUserData } from '@nhost/nextjs';

export function ImportPage() {
  const { isAuthenticated } = useAuthenticationStatus();
  const user = useUserData();
  
  // Check user role from JWT claims
  const userRole = user?.metadata?.organizationRole;
  const canImport = ['admin', 'write'].includes(userRole);
  
  if (!isAuthenticated || !canImport) {
    return <AccessDenied />;
  }
  
  return <ImportInterface />;
}
```

**Alternatives Considered**:
- **Client-side only**: Insecure, can be bypassed
- **Custom middleware**: Hasura provides this out-of-box, no need to reimplement
- **Organization-level config**: Over-engineering for initial release (spec lists this as P3 alternative)

---

## Summary of Technical Decisions

| Area | Decision | Key Dependencies |
|------|----------|------------------|
| **Excel Parsing** | xlsx (SheetJS) | `xlsx`, `@types/xlsx` |
| **File Upload** | Nhost File Storage + GraphQL | `@nhost/nextjs`, `@nhost/nhost-js` |
| **Validation** | DFS circular detection, batch queries | Native TypeScript/JavaScript |
| **Upsert** | Code-based matching with explicit tracking | PostgreSQL queries via Hasura |
| **Error Reporting** | Fail-fast with accumulation, row-specific | Native TypeScript/JavaScript |
| **Template** | Static pre-generated Excel file | Public folder |
| **i18n** | next-intl with import-specific keys | `next-intl ^4.4.0` (existing) |
| **RBAC** | Hasura role-based permissions | Nhost JWT claims |

**All NEEDS CLARIFICATION items resolved.** Ready for Phase 1: Design & Contracts.
