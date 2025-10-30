# GraphQL API Contract: Excel Import

**Feature**: Excel Import for Departments and Positions  
**Date**: October 29, 2025  
**API Style**: GraphQL (via Nhost/Hasura)

## Overview

This contract defines the GraphQL API for importing departments and positions from Excel files. The API follows a two-phase pattern:
1. **Parse & Validate**: Upload file, get preview with validation results
2. **Confirm Import**: Execute upsert operations after user confirmation

## Mutations

### 1. parseImportFile

**Purpose**: Upload Excel file, parse content, validate data, return preview

**Input**:
```graphql
input ParseImportFileInput {
  fileId: String!          # Nhost File Storage ID (from file upload)
  organizationId: String!  # Organization to import data into
}
```

**Output**:
```graphql
type ParseImportFileOutput {
  success: Boolean!
  preview: ImportPreview
  errors: [ValidationError!]
}

type ImportPreview {
  summary: ImportSummary!
  departments: [DepartmentPreview!]!
  positions: [PositionPreview!]!
  validationStatus: ValidationStatus!
}

type ImportSummary {
  totalRows: Int!
  departments: EntitySummary!
  positions: EntitySummary!
}

type EntitySummary {
  total: Int!
  creates: Int!
  updates: Int!
}

type DepartmentPreview {
  operation: OperationType!
  dept_code: String!
  name: String!
  parent_dept_code: String
  metadata: JSONObject
  excelRow: Int!
}

type PositionPreview {
  operation: OperationType!
  pos_code: String!
  title: String!
  dept_code: String!
  reports_to_pos_code: String
  is_manager: Boolean!
  is_active: Boolean!
  incumbents_count: Int!
  excelRow: Int!
}

enum OperationType {
  CREATE
  UPDATE
}

enum ValidationStatus {
  VALID
  ERRORS
}

type ValidationError {
  type: ErrorType!
  severity: ErrorSeverity!
  row: Int!
  sheet: SheetType!
  column: String
  message: String!
  suggestion: String
  affectedCodes: [String!]
}

enum ErrorType {
  INVALID_FILE_FORMAT
  MISSING_SHEET
  MISSING_COLUMN
  MISSING_REQUIRED_FIELD
  DUPLICATE_CODE_IN_FILE
  DUPLICATE_CODE_IN_DATABASE
  INVALID_REFERENCE
  CIRCULAR_REFERENCE
  INVALID_DATA_TYPE
  INVALID_JSON
  FILE_TOO_LARGE
}

enum ErrorSeverity {
  ERROR
  WARNING
}

enum SheetType {
  DEPARTMENTS
  POSITIONS
}

scalar JSONObject
```

**GraphQL Mutation**:
```graphql
mutation ParseImportFile($input: ParseImportFileInput!) {
  parseImportFile(input: $input) {
    success
    preview {
      summary {
        totalRows
        departments {
          total
          creates
          updates
        }
        positions {
          total
          creates
          updates
        }
      }
      departments {
        operation
        dept_code
        name
        parent_dept_code
        metadata
        excelRow
      }
      positions {
        operation
        pos_code
        title
        dept_code
        reports_to_pos_code
        is_manager
        is_active
        incumbents_count
        excelRow
      }
      validationStatus
    }
    errors {
      type
      severity
      row
      sheet
      column
      message
      suggestion
      affectedCodes
    }
  }
}
```

**Behavior**:
- Requires authenticated user with write/admin role on organization
- Downloads file from Nhost File Storage using `fileId`
- Parses Excel file (both Departments and Positions sheets if present)
- Validates all rules from data-model.md
- Queries existing departments and positions to detect creates vs updates
- Returns preview data OR validation errors
- Does NOT modify database (preview only)

**Error Responses**:
```graphql
# Access denied (read-only user)
{
  "success": false,
  "errors": [{
    "type": "ACCESS_DENIED",
    "severity": "ERROR",
    "message": "User does not have permission to import data",
    "row": 0,
    "sheet": "DEPARTMENTS"
  }]
}

# File not found
{
  "success": false,
  "errors": [{
    "type": "FILE_NOT_FOUND",
    "severity": "ERROR",
    "message": "File not found in Nhost Storage",
    "row": 0,
    "sheet": "DEPARTMENTS"
  }]
}

# Validation errors
{
  "success": false,
  "errors": [
    {
      "type": "DUPLICATE_CODE_IN_FILE",
      "severity": "ERROR",
      "row": 5,
      "sheet": "DEPARTMENTS",
      "column": "dept_code",
      "message": "Duplicate dept_code: IT",
      "suggestion": "Ensure all dept_codes are unique within the file"
    },
    {
      "type": "CIRCULAR_REFERENCE",
      "severity": "ERROR",
      "row": 8,
      "sheet": "DEPARTMENTS",
      "message": "Circular reference detected: IT → IT-DEV → IT-OPS → IT",
      "affectedCodes": ["IT", "IT-DEV", "IT-OPS"]
    }
  ]
}
```

---

### 2. confirmImport

**Purpose**: Execute upsert operations for departments and positions after user confirmation

**Input**:
```graphql
input ConfirmImportInput {
  fileId: String!          # Same file ID from parseImportFile
  organizationId: String!  # Same organization ID
}
```

**Output**:
```graphql
type ConfirmImportOutput {
  success: Boolean!
  result: ImportResult
  error: String
}

type ImportResult {
  departmentsCreated: Int!
  departmentsUpdated: Int!
  positionsCreated: Int!
  positionsUpdated: Int!
  totalDepartments: Int!
  totalPositions: Int!
}
```

**GraphQL Mutation**:
```graphql
mutation ConfirmImport($input: ConfirmImportInput!) {
  confirmImport(input: $input) {
    success
    result {
      departmentsCreated
      departmentsUpdated
      positionsCreated
      positionsUpdated
      totalDepartments
      totalPositions
    }
    error
  }
}
```

**Behavior**:
- Requires authenticated user with write/admin role on organization
- Re-downloads and re-validates file (security: prevent data change between parse and confirm)
- If validation fails, returns error without modifying database
- Executes upsert operations in a single database transaction:
  1. Upsert departments (ON CONFLICT UPDATE)
  2. Upsert positions (ON CONFLICT UPDATE)
- If any error occurs, entire transaction rolls back
- On success, returns counts of created/updated records

**Error Responses**:
```graphql
# Validation changed (file or database state changed)
{
  "success": false,
  "error": "Validation failed. Database state may have changed. Please preview again."
}

# Transaction failure
{
  "success": false,
  "error": "Import transaction failed: Foreign key violation on department_id"
}

# Access denied
{
  "success": false,
  "error": "User does not have permission to import data"
}
```

**Success Response**:
```graphql
{
  "success": true,
  "result": {
    "departmentsCreated": 45,
    "departmentsUpdated": 12,
    "positionsCreated": 230,
    "positionsUpdated": 85,
    "totalDepartments": 57,
    "totalPositions": 315
  }
}
```

---

## Queries

### 1. getImportTemplate

**Purpose**: Get information about the Excel template (not actual file download, just metadata)

**Output**:
```graphql
type ImportTemplate {
  filename: String!
  downloadUrl: String!
  version: String!
  lastUpdated: String!
  description: String!
}
```

**GraphQL Query**:
```graphql
query GetImportTemplate {
  getImportTemplate {
    filename
    downloadUrl
    version
    lastUpdated
    description
  }
}
```

**Response**:
```graphql
{
  "getImportTemplate": {
    "filename": "departments-positions-template.xlsx",
    "downloadUrl": "/templates/departments-positions-template.xlsx",
    "version": "1.0",
    "lastUpdated": "2025-10-29",
    "description": "Template for importing departments and positions with example data"
  }
}
```

**Note**: Actual file download is a direct HTTP GET to the `downloadUrl` (static public file), not via GraphQL.

---

## Authorization Rules

### Hasura Permission Configuration

```yaml
# parseImportFile mutation
permissions:
  - role: user
    permission:
      check:
        _and:
          - organization:
              members:
                _and:
                  - user_id: { _eq: X-Hasura-User-Id }
                  - role: { _in: [admin, write] }
          - organization_id: { _eq: X-Hasura-Organization-Id }

# confirmImport mutation
permissions:
  - role: user
    permission:
      check:
        _and:
          - organization:
              members:
                _and:
                  - user_id: { _eq: X-Hasura-User-Id }
                  - role: { _in: [admin, write] }
          - organization_id: { _eq: X-Hasura-Organization-Id }
```

**Role Requirements**:
- User must be authenticated (JWT token required)
- User must be a member of the target organization
- User must have `admin` or `write` role in that organization
- `read` role users cannot access these mutations

---

## File Upload Flow

### Client-Side File Upload (Pre-mutation)

```typescript
import { useFileUpload } from '@nhost/nextjs';

// 1. Upload file to Nhost Storage
const { upload, isUploading, progress } = useFileUpload();

const uploadFile = async (file: File) => {
  const { fileMetadata, error } = await upload({ 
    file,
    bucketId: 'imports' // Optional: organize uploads
  });
  
  if (error) {
    throw new Error('File upload failed');
  }
  
  return fileMetadata.id; // Use this in parseImportFile mutation
};

// 2. Call parseImportFile with file ID
const fileId = await uploadFile(selectedFile);

const { data } = await client.mutate({
  mutation: PARSE_IMPORT_FILE,
  variables: {
    input: {
      fileId,
      organizationId: currentOrgId
    }
  }
});
```

---

## Error Handling Patterns

### Client-Side Error Display

```typescript
interface DisplayError {
  title: string;
  description: string;
  rows?: Array<{
    row: number;
    column?: string;
    message: string;
    suggestion?: string;
  }>;
}

function formatValidationErrors(errors: ValidationError[]): DisplayError {
  if (errors.length === 0) {
    return {
      title: 'No errors',
      description: 'File is valid and ready to import'
    };
  }
  
  // Group by type
  const byType = errors.reduce((acc, err) => {
    if (!acc[err.type]) acc[err.type] = [];
    acc[err.type].push(err);
    return acc;
  }, {} as Record<ErrorType, ValidationError[]>);
  
  return {
    title: `${errors.length} validation error(s) found`,
    description: 'Please fix the errors below and try again',
    rows: errors.map(err => ({
      row: err.row,
      column: err.column,
      message: err.message,
      suggestion: err.suggestion
    }))
  };
}
```

---

## Performance Considerations

### Response Size Limits

- **Preview data**: Limited to first 100 records per entity type (with indicator if more exist)
- **Validation errors**: All errors returned (no limit, but typically < 100)
- **File size**: 5MB max enforced at upload and parse

### Caching

- `getImportTemplate` query: Cache-Control: public, max-age=86400 (24 hours)
- `parseImportFile` mutation: No caching (validation must be fresh)
- `confirmImport` mutation: No caching (write operation)

### Timeout Configuration

- Parse operation: 30 second timeout
- Confirm import operation: 60 second timeout (allows for large batch inserts)
- File upload: 120 second timeout (5MB over slow connections)

---

## Testing Contracts

### Unit Test Examples

```graphql
# Test: Valid file with creates only
mutation {
  parseImportFile(input: {
    fileId: "valid-file-id",
    organizationId: "org-123"
  }) {
    success # expect: true
    preview {
      summary {
        departments { creates updates } # expect: creates=10, updates=0
        positions { creates updates }    # expect: creates=50, updates=0
      }
      validationStatus # expect: VALID
    }
    errors # expect: []
  }
}

# Test: Validation error (duplicate code)
mutation {
  parseImportFile(input: {
    fileId: "duplicate-code-file-id",
    organizationId: "org-123"
  }) {
    success # expect: false
    errors {
      type    # expect: DUPLICATE_CODE_IN_FILE
      row     # expect: 5
      sheet   # expect: DEPARTMENTS
      column  # expect: "dept_code"
      message # expect: contains "Duplicate"
    }
  }
}

# Test: Successful import
mutation {
  confirmImport(input: {
    fileId: "valid-file-id",
    organizationId: "org-123"
  }) {
    success # expect: true
    result {
      departmentsCreated # expect: > 0
      positionsCreated   # expect: > 0
      totalDepartments   # expect: equals created + updated
    }
  }
}
```

---

## Summary

This API contract provides:
- ✅ Two-phase import (parse/validate → confirm) for user control
- ✅ Detailed validation errors with row/column specificity
- ✅ Preview of operations (create vs update) before execution
- ✅ Transactional safety (all-or-nothing imports)
- ✅ RBAC enforcement (write/admin only)
- ✅ Performance considerations (timeouts, response limits, caching)
- ✅ Clear error messages for client-side display

**Ready for implementation and testing.**
