# Feature Specification: Excel Import for Departments and Positions

**Feature Branch**: `005-excel-import-ui`  
**Created**- **FR-005- **FR- **FR-005**: System MUST provide downloadable Excel templates with two sheets (Departments and Positions) containing example data demonstrating proper structure
- **FR-006**: System MUST display clear instructions on the upload page explaining required columns, data formats, and how to establish relationships
- **FR-007**: System MUST validate uploaded Excel files contain required sheets (at least one of: Departments or Positions)02**: System MUST restrict import functionality to users with write or admin permissions on the organization; read-only users cannot access the import feature
- **FR-003**: System MUST limit file uploads to one file at a time with a maximum size of 5MB
- **FR-004**: System MUST use Nhost's upload function for server-side file processing
- **FR-005**: System MUST provide downloadable Excel templates with two sheets (Departments and Positions) containing example data demonstrating proper structure- **FR-011**: System MUST support upsert behavior: update existing records when codes match, insert new records when codes are new
- **FR-012**: System MUST validate parent_dept_code references in Departments sheet point to valid dept_code values within the same file or existing departments
- **FR-013**: System MUST validate reports_to_pos_code references in Positions sheet point to valid pos_code values within the same file or existing positions
- **FR-014**: System MUST validate dept_code references in Positions sheet point to valid dept_code values within the same file or existing departments
- **FR-015**: System MUST prevent circular references in department hierarchies (parent_dept_code chains)
- **FR-016**: System MUST prevent circular references in position reporting relationships (reports_to_pos_code chains)em MUST display clear instructions on the upload page explaining required columns, data formats, and how to establish relationships
- **FR-006**: System MUST validate uploaded Excel files contain required sheets (at least one of: Departments or Positions)
- **FR-007**: System MUST validate Departments sheet contains required columns: dept_code, name; optional columns: parent_dept_code, metadata
- **FR-008**: System MUST validate Positions sheet contains required columns: pos_code, title, dept_code; optional columns: reports_to_pos_code, is_manager, is_active, incumbents_count
- **FR-009**: System MUST automatically associate organization_id for all imported records based on the current user's organizationtober 29, 2025  
**Status**: Draft  
**Input**: User description: "Create a UI where users can upload Excel files that include information for departments and positions, making it clear how to structure their Excel files"

## Clarifications

### Session 2025-10-29

- Q: Where should the Excel file parsing and validation logic execute? → A: Use Nhost upload function (server-side processing)
- Q: How should users reference parent departments and reporting managers in the Excel file? → A: Use codes (parent_dept_code, reports_to_pos_code - human-readable references)
- Q: How should the system handle blank or partially filled rows in the Excel file? → A: Skip rows with all empty cells, error on rows with partial data
- Q: When a user uploads an Excel file with dept_code or pos_code values that already exist in their organization, what should happen? → A: Update existing records if codes match, insert new ones (upsert behavior)
- Q: Should users with read-only access to the organization be able to import Excel files? → A: No, only users with write/admin permissions can import

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload Department and Position Data (Priority: P1)

An organization administrator needs to quickly populate their organization's structure by uploading an Excel file containing departments and positions, rather than manually entering hundreds of records one by one.

**Why this priority**: This is the core functionality that enables bulk data import, providing immediate value by reducing data entry time from hours to minutes.

**Independent Test**: Can be fully tested by uploading a valid Excel file with sample departments and positions, and verifying the data appears correctly in the organization's structure, delivering the value of rapid bulk data entry.

**Acceptance Scenarios**:

1. **Given** a user has signed in and created their organization, **When** they navigate to the data import section, **Then** they see a clear upload interface with instructions on how to structure their Excel file
2. **Given** a user views the upload interface, **When** they look for guidance, **Then** they see a downloadable Excel template with pre-filled example data showing the correct structure
3. **Given** a user has a properly formatted Excel file, **When** they drag and drop or select the file, **Then** the system accepts the file and shows upload progress
4. **Given** a user uploads a valid Excel file, **When** the upload completes, **Then** the system displays a preview of the data to be imported with row counts for departments and positions
5. **Given** a user reviews the data preview, **When** they confirm the import, **Then** all departments and positions are saved to the database with correct relationships
6. **Given** a user completes an import, **When** they view their organization structure, **Then** they see all imported departments and positions correctly organized in the hierarchy

---

### User Story 2 - Understand Excel Structure Requirements (Priority: P1)

A user needs clear guidance on how to structure their Excel file before uploading, including which columns are required, what format to use for codes and IDs, and how to establish parent-child relationships.

**Why this priority**: Without clear guidance, users will create incorrectly formatted files leading to import failures and frustration. This is critical for successful adoption.

**Independent Test**: Can be tested by reviewing the interface for completeness of instructions, downloading the template, and verifying it contains all necessary columns with example data that demonstrates proper formatting.

**Acceptance Scenarios**:

1. **Given** a user is on the import page, **When** they look for structure guidance, **Then** they see a detailed explanation of required columns for departments and positions
2. **Given** a user reads the instructions, **When** they need examples, **Then** they can download a template Excel file with sample data demonstrating proper structure
3. **Given** a user downloads the template, **When** they open it, **Then** they see two sheets (Departments and Positions) with clearly labeled columns and example rows
4. **Given** a user views the template, **When** they examine the Positions sheet, **Then** they see examples showing how to reference department codes and create reporting relationships
5. **Given** a user needs to understand parent-child relationships, **When** they review the documentation, **Then** they see clear examples of how to use parent_id for departments and reports_to_id for positions

---

### User Story 3 - Handle Import Errors Gracefully (Priority: P2)

A user uploads an Excel file with formatting issues or invalid data, and needs clear feedback on what went wrong and how to fix it, without losing their work.

**Why this priority**: Error handling prevents user frustration and abandoned imports. While not as critical as the happy path, it's essential for a production-ready feature.

**Independent Test**: Can be tested by uploading files with various types of errors (missing columns, invalid references, duplicate codes) and verifying clear, actionable error messages are displayed for each case.

**Acceptance Scenarios**:

1. **Given** a user uploads an Excel file with missing required columns, **When** the system validates the file, **Then** they see a specific error message listing which columns are missing
2. **Given** a user uploads a file with invalid department or position codes (duplicates or invalid characters), **When** validation runs, **Then** they see row-specific error messages indicating which codes are problematic
3. **Given** a user uploads a file with positions referencing non-existent department codes, **When** validation completes, **Then** they see which position rows have invalid department references
4. **Given** a user receives validation errors, **When** they review the errors, **Then** they can download the original file to correct issues without re-entering data
5. **Given** a user encounters an error, **When** they read the error message, **Then** it includes specific guidance on how to fix the issue

---

### User Story 4 - Import Only Departments or Only Positions (Priority: P3)

A user may need to import only departments first to establish the organizational structure, or add positions to existing departments without re-importing department data.

**Why this priority**: Provides flexibility for phased data entry and updates, but the feature is functional without this capability.

**Independent Test**: Can be tested by uploading an Excel file containing only a Departments sheet (no Positions sheet) and verifying departments import successfully, then uploading a file with only Positions sheet to existing departments.

**Acceptance Scenarios**:

1. **Given** a user has an Excel file with only the Departments sheet, **When** they upload it, **Then** the system imports only departments without requiring a Positions sheet
2. **Given** a user has existing departments, **When** they upload an Excel file with only the Positions sheet, **Then** the system imports positions and links them to existing departments using department codes
3. **Given** a user uploads a partial import file, **When** the import completes, **Then** they see a summary showing which data types were imported

---

### User Story 5 - Update Existing Data Through Re-import (Priority: P1)

A user needs to update existing departments or positions by uploading a new Excel file with modified data, using codes to match and update existing records rather than creating duplicates.

**Why this priority**: Upsert behavior is core functionality that enables users to maintain a single master Excel file and upload it repeatedly as their organization evolves, without managing complex update/delete operations.

**Independent Test**: Can be tested by importing initial data, then uploading a modified Excel file with the same dept_code/pos_code values but changed attributes, and verifying records are updated rather than duplicated.

**Acceptance Scenarios**:

1. **Given** a user has previously imported departments, **When** they upload a new file with the same dept_code values but different names, **Then** the system updates existing departments rather than creating duplicates
2. **Given** a user uploads an update file, **When** validation runs, **Then** they see a preview indicating which records will be updated vs newly created
3. **Given** a user confirms an update import, **When** the import completes, **Then** they see a summary of how many records were updated vs created

---

### Edge Cases

- What happens when a user uploads a file larger than the system's size limit?
- What happens when an Excel file contains special characters or emojis in department/position names?
- How does the system handle circular references in reporting relationships (e.g., Position A reports to Position B which reports to Position A)?
- What happens when a user uploads a file with thousands of rows - does the import have timeout protections?
- How does the system handle Excel files with additional sheets beyond Departments and Positions?
- What happens if a user closes the browser during an active import?
- How does the system handle blank rows in the middle of the Excel file? (Resolved: Skip completely empty rows, error on partial data)
- What happens when department parent_dept_code or position reports_to_pos_code reference codes that don't exist in the uploaded file?
- How does the system validate and handle boolean fields (is_manager, is_active) if users enter text instead of TRUE/FALSE?
- What happens when a user uploads a file format that looks like Excel but is actually CSV or a different format?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a file upload interface accessible from the organization dashboard that accepts Excel files (.xlsx, .xls formats)
- **FR-002**: System MUST restrict import functionality to users with write or admin permissions on the organization; read-only users cannot access the import feature
- **FR-003**: System MUST limit file uploads to one file at a time with a maximum size of 5MB
- **FR-004**: System MUST use Nhost's upload function for server-side file processing
- **FR-005**: System MUST provide downloadable Excel templates with two sheets (Departments and Positions) containing example data demonstrating proper structure
- **FR-006**: System MUST display clear instructions on the upload page explaining required columns, data formats, and how to establish relationships
- **FR-007**: System MUST validate uploaded Excel files contain required sheets (at least one of: Departments or Positions)
- **FR-008**: System MUST validate Departments sheet contains required columns: dept_code, name; optional columns: parent_dept_code, metadata
- **FR-009**: System MUST validate Positions sheet contains required columns: pos_code, title, dept_code; optional columns: reports_to_pos_code, is_manager, is_active, incumbents_count
- **FR-010**: System MUST automatically associate organization_id for all imported records based on the current user's organization
- **FR-011**: System MUST validate dept_code and pos_code values are unique within the organization for new records
- **FR-012**: System MUST support upsert behavior: update existing records when codes match, insert new records when codes are new
- **FR-013**: System MUST validate parent_dept_code references in Departments sheet point to valid dept_code values within the same file or existing departments
- **FR-014**: System MUST validate reports_to_pos_code references in Positions sheet point to valid pos_code values within the same file or existing positions
- **FR-015**: System MUST validate dept_code references in Positions sheet point to valid dept_code values within the same file or existing departments
- **FR-016**: System MUST prevent circular references in department hierarchies (parent_dept_code chains)
- **FR-017**: System MUST prevent circular references in position reporting relationships (reports_to_pos_code chains)
- **FR-018**: System MUST skip rows where all cells are empty, but display validation errors for rows with partial data missing required fields
- **FR-019**: System MUST display validation errors with specific row numbers and column names indicating what needs to be corrected
- **FR-020**: System MUST show a preview of parsed data before final import, displaying row counts, sample records, and counts of records to be created vs updated
- **FR-021**: System MUST allow users to cancel import before final confirmation
- **FR-022**: System MUST process imports transactionally so that if any error occurs during save, no partial data is committed
- **FR-023**: System MUST display import progress during file processing
- **FR-024**: System MUST display success confirmation after import with summary of records created and updated (departments count and positions count)
- **FR-025**: System MUST handle optional columns (parent_dept_code for departments, reports_to_pos_code for positions, metadata for departments)
- **FR-026**: System MUST apply default values for positions: is_manager (false), is_active (true), incumbents_count (1) when not provided
- **FR-027**: System MUST allow positions to be imported without a manager reference (reports_to_pos_code can be null or empty)
- **FR-028**: System MUST allow departments to be imported at root level (parent_dept_code can be null or empty)
- **FR-029**: System MUST preserve metadata as JSON when provided in Departments sheet

### Key Entities

- **Department**: Represents an organizational unit within a company; includes a unique code, name, optional parent relationship for hierarchy, and flexible metadata storage
- **Position**: Represents a job role within a department; includes a unique code, title, department association, optional reporting relationship to another position, manager flag, active status, and incumbent count
- **Organization**: The parent entity for all departments and positions; imports are scoped to the user's current organization

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload and import a file containing 100 departments and 500 positions in under 30 seconds (excluding file upload time)
- **SC-002**: Users can understand Excel structure requirements without external support by reviewing on-page instructions and template file
- **SC-003**: 90% of users successfully complete their first import without validation errors when using the provided template
- **SC-004**: System displays specific, actionable error messages for 100% of validation failures, including row and column references
- **SC-005**: Import process prevents 100% of invalid data (missing required fields, invalid references) from being saved to database
- **SC-006**: Users can see their imported organizational structure immediately after import completion without needing to refresh or navigate away
- **SC-007**: The template file and instructions reduce time-to-first-successful-import by 80% compared to manual data entry

## Assumptions

- Users have basic familiarity with Excel and understand concepts like sheets, rows, and columns
- Organization structure data is available in a format that can be transferred to Excel (existing spreadsheets, exports from other systems, etc.)
- A single organization typically has fewer than 1,000 departments and 5,000 positions to import at once
- Department codes (dept_code) and position codes (pos_code) follow standard alphanumeric patterns (letters, numbers, hyphens, underscores)
- Users have already created their organization in the system before attempting to import data
- The system has a role-based access control (RBAC) mechanism that distinguishes between read-only, write, and admin permissions
- File size limit of 5MB is sufficient for typical organizational structures (can handle ~25,000 rows); very large organizations can split imports into multiple files
- Users prefer drag-and-drop or click-to-upload interfaces over other upload methods
- Excel files are the preferred format for bulk data import (as opposed to CSV, JSON, or direct database access)
- Nhost's upload function handles file storage and provides URLs for backend processing
- Server-side validation provides security and consistency across all clients
- Metadata fields are stored as valid JSON objects when provided
- Boolean fields in Excel accept standard TRUE/FALSE or 1/0 values
- The system has sufficient server resources to process imports transactionally without timeout issues for files within size limits
- References between entities use human-readable codes (dept_code, pos_code) rather than database UUIDs for user-friendliness
