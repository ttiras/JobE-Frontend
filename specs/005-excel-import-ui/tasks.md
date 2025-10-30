# Tasks: Excel Import for Departments and Positions

**Input**: Design documents from `/specs/005-excel-import-ui/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: Following TDD principle per constitution - ALL tests written and failing BEFORE implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js 16.0.0 App Router application:
- Frontend: `app/[locale]/(dashboard)/import/`
- Components: `components/import/`
- GraphQL: `lib/graphql/mutations/`, `lib/graphql/queries/`
- Types: `lib/types/import.ts`
- Utils: `lib/utils/excel/`
- Tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- Public: `public/templates/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and basic structure

- [x] T001 Install xlsx library: `pnpm add xlsx @types/xlsx`
- [x] T002 Create Excel import route structure: `app/[locale]/(dashboard)/import/page.tsx`
- [x] T003 [P] Create import components directory: `components/import/`
- [x] T004 [P] Create Excel utility functions directory: `lib/utils/excel/`
- [x] T005 [P] Create import types file: `lib/types/import.ts`
- [x] T006 [P] Create GraphQL mutations directory for import: `lib/graphql/mutations/import.ts`
- [x] T007 [P] Add internationalization keys for import UI in `messages/en.json` and `messages/tr.json`
- [ ] T008 Create Excel template file: `public/templates/departments-positions-template.xlsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 [P] Define TypeScript types for import feature (entities, errors, states, API contracts) in `lib/types/import.ts`
- [x] T010 [P] Define GraphQL mutation signatures for parseImportFile and confirmImport in `lib/nhost/graphql/mutations/import.ts`
- [x] T011 [P] Create base FileUpload component with Nhost integration (drag-drop, progress, validation) in `components/import/file-upload.tsx`
- [x] T012 [P] Create base ValidationErrorList component (display errors with row/column details, severity, suggestions) in `components/import/validation-error-list.tsx`
- [x] T013 [P] Create base DataPreviewTable component (display departments/positions with CREATE/UPDATE indicators) in `components/import/data-preview-table.tsx`
- [x] T014 [P] Create base ImportConfirmationDialog component (summary, warning, confirm/cancel actions) in `components/import/import-confirmation-dialog.tsx`
- [x] T015 Implement Excel parser utility (readExcelFile, validateSheets, parseSheetData) in `lib/utils/excel/parser.ts`
- [x] T016 Implement validation utilities (validateCircularRefs DFS algorithm, validateReferences, validateRequiredFields) in `lib/utils/excel/validator.ts`
- [x] T017 Implement useImportWorkflow custom hook (state management, GraphQL integration, error handling) in `hooks/useImportWorkflow.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Upload Department and Position Data (Priority: P1) 🎯 MVP

**Goal**: Core import functionality - upload Excel file, validate, preview, confirm, and execute import with upsert behavior

**Independent Test**: Upload valid Excel file with sample departments/positions, verify preview shows correct counts and operations (create/update), confirm import, verify data in database

### Tests for User Story 1 (TDD - Write First, Ensure FAIL)

- [x] T018 [P] [US1] Unit test for Excel file reading in `tests/unit/excel/parser.test.ts`
- [x] T019 [P] [US1] Unit test for circular reference detection in `tests/unit/excel/validator.test.ts`
- [x] T020 [P] [US1] Unit test for upsert detection logic in `tests/unit/excel/upsert-detector.test.ts`
- [x] T021 [P] [US1] Component test for FileUpload in `tests/unit/components/file-upload.test.tsx`
- [x] T022 [P] [US1] Component test for DataPreviewTable in `tests/unit/components/data-preview-table.test.tsx`
- [x] T023 [P] [US1] Component test for ImportConfirmationDialog in `tests/unit/components/import-confirmation-dialog.test.tsx`
- [x] T024 [US1] Integration test for upload → parse → validate → preview flow in `tests/integration/import/upload-flow.test.ts`
- [x] T025 [US1] Integration test for confirm → execute → success flow in `tests/integration/import/confirm-flow.test.ts`
- [x] T026 [US1] E2E test for complete import journey in `tests/e2e/import/complete-import.spec.ts`

### Implementation for User Story 1

- [ ] T027 [US1] Implement Excel file reader with xlsx library in `lib/utils/excel/parser.ts` (read workbook, extract sheets, convert to JSON)
- [ ] T028 [US1] Implement sheet structure validation in `lib/utils/excel/validator.ts` (required columns, data types)
- [ ] T029 [US1] Implement circular reference detection using DFS algorithm in `lib/utils/excel/circular-ref-detector.ts`
- [ ] T030 [US1] Implement code uniqueness validation in `lib/utils/excel/validator.ts` (dept_code, pos_code within file)
- [ ] T031 [US1] Implement reference validation in `lib/utils/excel/reference-validator.ts` (parent_dept_code, reports_to_pos_code, dept_code in positions)
- [ ] T032 [US1] Implement upsert detection logic in `lib/utils/excel/upsert-detector.ts` (query existing records by codes, mark create vs update)
- [ ] T033 [US1] Implement FileUpload component with drag-drop, progress tracking, file size validation in `components/import/file-upload.tsx`
- [ ] T034 [US1] Implement DataPreviewTable component showing parsed data with operation indicators (CREATE/UPDATE) in `components/import/data-preview-table.tsx`
- [ ] T035 [US1] Implement ImportConfirmationDialog with summary counts in `components/import/import-confirmation-dialog.tsx`
- [ ] T036 [US1] Implement useImportWorkflow hook managing upload → parse → preview → confirm states in `hooks/useImportWorkflow.ts`
- [ ] T037 [US1] Implement main import page connecting all components in `app/[locale]/(dashboard)/import/page.tsx`
- [ ] T038 [US1] Implement GraphQL parseImportFile mutation integration in `lib/graphql/mutations/import.ts`
- [ ] T039 [US1] Implement GraphQL confirmImport mutation integration in `lib/graphql/mutations/import.ts`
- [ ] T040 [US1] Add success notification with import summary (records created/updated) in `app/[locale]/(dashboard)/import/page.tsx`
- [ ] T041 [US1] Add error handling for upload failures, parsing errors, validation errors in `hooks/useImportWorkflow.ts`
- [ ] T042 [US1] Verify all US1 tests pass and import flow works end-to-end

**Checkpoint**: At this point, User Story 1 should be fully functional - users can upload Excel files and import departments/positions with upsert behavior

---

## Phase 4: User Story 2 - Understand Excel Structure Requirements (Priority: P1)

**Goal**: Provide clear guidance on Excel file structure through instructions, template download, and examples

**Independent Test**: Review import page for instruction completeness, download template, verify it has correct sheets/columns/examples

### Tests for User Story 2 (TDD - Write First, Ensure FAIL)

- [ ] T043 [P] [US2] Component test for InstructionsPanel in `tests/unit/components/instructions-panel.test.tsx`
- [ ] T044 [P] [US2] Component test for TemplateDownloadButton in `tests/unit/components/template-download-button.test.tsx`
- [ ] T045 [US2] Unit test for template file existence and structure in `tests/unit/templates/template-validation.test.ts`
- [ ] T046 [US2] E2E test for downloading template and viewing instructions in `tests/e2e/import/template-download.spec.ts`

### Implementation for User Story 2

- [ ] T047 [P] [US2] Create Excel template with Departments sheet (dept_code, name, parent_dept_code, metadata columns + 3 example rows) in `public/templates/departments-positions-template.xlsx`
- [ ] T048 [P] [US2] Add Positions sheet to template (pos_code, title, dept_code, reports_to_pos_code, is_manager, is_active, incumbents_count columns + 5 example rows) in `public/templates/departments-positions-template.xlsx`
- [ ] T049 [US2] Create InstructionsPanel component with required columns, formats, relationship examples in `components/import/instructions-panel.tsx`
- [ ] T050 [US2] Create TemplateDownloadButton component in `components/import/template-download-button.tsx`
- [ ] T051 [US2] Add InstructionsPanel to import page above upload area in `app/[locale]/(dashboard)/import/page.tsx`
- [ ] T052 [US2] Add TemplateDownloadButton to import page in prominent position in `app/[locale]/(dashboard)/import/page.tsx`
- [ ] T053 [US2] Add internationalization for instructions in `messages/en.json` and `messages/tr.json`
- [ ] T054 [US2] Verify all US2 tests pass and instructions/template are clear and complete

**Checkpoint**: At this point, User Stories 1 AND 2 are complete - users can understand structure requirements and successfully import data

---

## Phase 5: User Story 5 - Update Existing Data Through Re-import (Priority: P1)

**Goal**: Enable upsert behavior with visual indication in preview showing which records will be created vs updated

**Independent Test**: Import initial data, upload modified Excel with same codes but different attributes, verify preview shows UPDATE operations, confirm import, verify records updated not duplicated

**Note**: Core upsert logic implemented in US1, this story adds UI enhancements for update visibility

### Tests for User Story 5 (TDD - Write First, Ensure FAIL)

- [ ] T055 [P] [US5] Integration test for upsert behavior (create then update) in `tests/integration/import/upsert-flow.test.ts`
- [ ] T056 [P] [US5] Component test for operation badges (CREATE/UPDATE) in DataPreviewTable in `tests/unit/components/data-preview-table.test.tsx`
- [ ] T057 [US5] E2E test for re-import workflow in `tests/e2e/import/re-import.spec.ts`

### Implementation for User Story 5

- [ ] T058 [P] [US5] Add operation type badges (CREATE in green, UPDATE in blue) to DataPreviewTable in `components/import/data-preview-table.tsx`
- [ ] T059 [US5] Add create/update counts to ImportConfirmationDialog summary in `components/import/import-confirmation-dialog.tsx`
- [ ] T060 [US5] Add filter toggle to DataPreviewTable (show all, creates only, updates only) in `components/import/data-preview-table.tsx`
- [ ] T061 [US5] Update success notification to show created vs updated counts separately in `app/[locale]/(dashboard)/import/page.tsx`
- [ ] T062 [US5] Verify all US5 tests pass and upsert UI clearly shows create vs update operations

**Checkpoint**: At this point, User Stories 1, 2, AND 5 are complete - MVP is ready with core import, guidance, and upsert visibility

---

## Phase 6: User Story 3 - Handle Import Errors Gracefully (Priority: P2)

**Goal**: Display clear, actionable validation errors with row/column specificity and guidance on fixing issues

**Independent Test**: Upload files with various errors (missing columns, duplicate codes, invalid references, circular refs), verify specific error messages with row numbers and suggestions

### Tests for User Story 3 (TDD - Write First, Ensure FAIL)

- [ ] T063 [P] [US3] Unit test for validation error formatting in `tests/unit/excel/error-formatter.test.ts`
- [ ] T064 [P] [US3] Component test for ValidationErrorList with grouped errors in `tests/unit/components/validation-error-list.test.tsx`
- [ ] T065 [P] [US3] Integration test for various validation error scenarios in `tests/integration/import/validation-errors.test.ts`
- [ ] T066 [US3] E2E test for error display and recovery in `tests/e2e/import/error-handling.spec.ts`

### Implementation for User Story 3

- [ ] T067 [US3] Enhance ValidationErrorList component with grouping by error type in `components/import/validation-error-list.tsx`
- [ ] T068 [US3] Add row and column highlighting in error messages in `components/import/validation-error-list.tsx`
- [ ] T069 [US3] Add actionable suggestions for each error type in `lib/utils/excel/error-formatter.ts`
- [ ] T070 [US3] Add error severity indicators (ERROR in red, WARNING in yellow) in `components/import/validation-error-list.tsx`
- [ ] T071 [US3] Implement error summary section (total errors, by type) in `components/import/validation-error-list.tsx`
- [ ] T072 [US3] Add ability to download original file after validation errors in `components/import/validation-error-list.tsx`
- [ ] T073 [US3] Add comprehensive error messages for all validation types (missing columns, duplicates, invalid references, circular refs, data type errors, file too large) in `lib/utils/excel/error-messages.ts`
- [ ] T074 [US3] Add internationalization for all error messages in `messages/en.json` and `messages/tr.json`
- [ ] T075 [US3] Verify all US3 tests pass and error handling is clear and helpful

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 5 are complete - import handles errors gracefully with clear guidance

---

## Phase 7: User Story 4 - Import Only Departments or Only Positions (Priority: P3)

**Goal**: Support partial imports - allow uploading files with only Departments sheet or only Positions sheet

**Independent Test**: Upload Excel with only Departments sheet, verify import succeeds. Upload Excel with only Positions sheet to existing departments, verify positions link correctly

### Tests for User Story 4 (TDD - Write First, Ensure FAIL)

- [ ] T076 [P] [US4] Unit test for partial sheet validation (departments only) in `tests/unit/excel/validator.test.ts`
- [ ] T077 [P] [US4] Unit test for partial sheet validation (positions only) in `tests/unit/excel/validator.test.ts`
- [ ] T078 [US4] Integration test for departments-only import in `tests/integration/import/departments-only.test.ts`
- [ ] T079 [US4] Integration test for positions-only import in `tests/integration/import/positions-only.test.ts`
- [ ] T080 [US4] E2E test for partial import workflows in `tests/e2e/import/partial-imports.spec.ts`

### Implementation for User Story 4

- [ ] T081 [US4] Update sheet validation to allow either Departments OR Positions sheet (not both required) in `lib/utils/excel/validator.ts`
- [ ] T082 [US4] Update DataPreviewTable to handle single entity type display in `components/import/data-preview-table.tsx`
- [ ] T083 [US4] Update ImportConfirmationDialog to show summary for single entity type in `components/import/import-confirmation-dialog.tsx`
- [ ] T084 [US4] Update success notification to handle partial import summaries in `app/[locale]/(dashboard)/import/page.tsx`
- [ ] T085 [US4] Add instructions explaining partial import capability in `components/import/instructions-panel.tsx`
- [ ] T086 [US4] Verify all US4 tests pass and partial imports work correctly

**Checkpoint**: At this point, ALL user stories (1, 2, 3, 4, 5) are complete - full feature functionality delivered

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality checks

- [ ] T087 [P] Add loading states and progress indicators throughout import flow in `components/import/`
- [ ] T088 [P] Add accessibility attributes (aria-labels, keyboard navigation) to all import components
- [ ] T089 [P] Add mobile-responsive styling for import page and components
- [ ] T090 [P] Optimize DataPreviewTable performance for large datasets (virtualization if needed)
- [ ] T091 [P] Add comprehensive JSDoc comments to all utility functions in `lib/utils/excel/`
- [ ] T092 [P] Verify all translation keys are bilingual (EN/TR) in `messages/en.json` and `messages/tr.json`
- [ ] T093 Add import feature documentation to main docs in `docs/import-feature.md`
- [ ] T094 Add import workflow diagram to documentation
- [ ] T095 Run full test suite (unit + integration + E2E) and verify 100% pass rate
- [ ] T096 Verify performance goals met (100 depts + 500 positions in <30s)
- [ ] T097 Verify file size limit enforcement (5MB max)
- [ ] T098 Verify RBAC enforcement (write/admin only access)
- [ ] T099 Run quickstart.md validation and update if needed
- [ ] T100 Final constitution check (all principles satisfied)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Foundational - No dependencies on other stories
  - US2 (P1): Can start after Foundational - No dependencies on other stories
  - US5 (P1): Builds on US1 upsert logic - Should start after US1 core implementation
  - US3 (P2): Can start after Foundational - Works with any story's validation
  - US4 (P3): Can start after Foundational - Independent of other stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core import functionality - Foundation for all other stories
  - Required for: US5 (extends upsert UI)
  - Independent of: US2, US3, US4
  
- **User Story 2 (P1)**: Instructions and template - Completely independent
  - Can develop in parallel with US1
  - No dependencies on other stories
  
- **User Story 5 (P1)**: Upsert UI enhancements - Extends US1
  - Depends on: US1 core upsert logic
  - Should start after US1 T032 (upsert detection) is complete
  
- **User Story 3 (P2)**: Error handling UI - Independent
  - Can develop in parallel with US1/US2
  - Integrates with any story's validation
  
- **User Story 4 (P3)**: Partial imports - Independent
  - Can develop in parallel with other stories
  - Minimal changes to existing components

### Within Each User Story

- **TDD Workflow**: Tests MUST be written and FAIL before implementation
- **Models → Services → UI**: Follow dependency order
- **Parallel opportunities**: Tasks marked [P] can run simultaneously
- **Story complete**: Verify all tests pass before moving to next priority

### Parallel Opportunities

#### Setup Phase (Phase 1)
All tasks can run in parallel after T001-T002:
```bash
T003: Create components directory
T004: Create utils directory  
T005: Create types file
T006: Create GraphQL mutations directory
T007: Add i18n keys
T008: Create template file
```

#### Foundational Phase (Phase 2)
After T009-T010, all component and utility tasks can run in parallel:
```bash
T011: FileUpload component
T012: ValidationErrorList component
T013: DataPreviewTable component
T014: ImportConfirmationDialog component
T015: Excel parser utils
T016: Validation utils
T017: useImportWorkflow hook
```

#### User Story 1 Tests (Phase 3)
All tests can be written in parallel:
```bash
T018-T023: Unit and component tests (all [P])
T024-T026: Integration and E2E tests (sequential)
```

#### Cross-Story Parallelism
If team has multiple developers:
- **Developer A**: US1 (core import)
- **Developer B**: US2 (instructions/template)  
- **Developer C**: US3 (error handling)

After US1 core complete:
- **Developer A**: US5 (upsert UI)
- **Developer D**: US4 (partial imports)

---

## Parallel Example: Foundational Phase

```bash
# After defining types (T009-T010), launch all components together:
Task T011: "FileUpload component in components/import/file-upload.tsx"
Task T012: "ValidationErrorList component in components/import/validation-error-list.tsx"
Task T013: "DataPreviewTable component in components/import/data-preview-table.tsx"
Task T014: "ImportConfirmationDialog component in components/import/import-confirmation-dialog.tsx"

# And all utilities together:
Task T015: "Excel parser in lib/utils/excel/parser.ts"
Task T016: "Validator in lib/utils/excel/validator.ts"
Task T017: "useImportWorkflow hook in hooks/useImportWorkflow.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T017) - CRITICAL foundation
3. Complete Phase 3: User Story 1 (T018-T042) - Core import functionality
4. Complete Phase 4: User Story 2 (T043-T054) - Instructions and guidance
5. **STOP and VALIDATE**: Test US1+US2 independently, verify users can successfully import with clear guidance
6. Deploy/demo MVP

**MVP Delivers**: 
- Users can upload Excel files with departments and positions
- Clear instructions and template provided
- Full validation and preview before import
- Upsert behavior (create + update)
- Success with import summary

### Incremental Delivery

1. **Foundation** (Phase 1-2) → Setup complete, components ready
2. **MVP** (Phase 3-4: US1+US2) → Core import + guidance → Deploy ✅
3. **Enhanced MVP** (+Phase 5: US5) → Upsert visibility → Deploy ✅
4. **Production Ready** (+Phase 6: US3) → Robust error handling → Deploy ✅
5. **Feature Complete** (+Phase 7: US4) → Partial imports → Deploy ✅
6. **Polished** (Phase 8) → Final optimizations → Deploy ✅

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers after Foundational phase:

**Sprint 1**:
- Developer A: US1 (core import) - T018-T042
- Developer B: US2 (instructions) - T043-T054
- Developer C: US3 (error handling) - T063-T075

**Sprint 2**:
- Developer A: US5 (upsert UI) - T055-T062
- Developer B: US4 (partial imports) - T076-T086
- Developer C: Polish tasks - T087-T100

Stories complete and integrate independently.

---

## Task Summary

- **Total Tasks**: 100
- **Phase 1 (Setup)**: 8 tasks
- **Phase 2 (Foundational)**: 9 tasks (BLOCKS all stories)
- **Phase 3 (US1 - Core Import)**: 25 tasks (9 tests + 16 implementation)
- **Phase 4 (US2 - Instructions)**: 12 tasks (4 tests + 8 implementation)
- **Phase 5 (US5 - Upsert UI)**: 8 tasks (3 tests + 5 implementation)
- **Phase 6 (US3 - Error Handling)**: 13 tasks (4 tests + 9 implementation)
- **Phase 7 (US4 - Partial Imports)**: 11 tasks (5 tests + 6 implementation)
- **Phase 8 (Polish)**: 14 tasks

**Test Coverage**: 25 test tasks across all user stories (unit + integration + E2E)

**Parallel Opportunities**: 45 tasks marked [P] can run in parallel within their phases

**Independent Test Criteria**:
- US1: Upload valid file → Preview shows correct data → Confirm → Database updated
- US2: View instructions completeness → Download template → Verify structure
- US5: Import initial data → Upload modified file → Preview shows UPDATEs → Confirm → Records updated not duplicated
- US3: Upload invalid files → Verify specific error messages with row/column details
- US4: Upload departments-only file → Import succeeds; Upload positions-only file → Links to existing departments

**MVP Scope**: Phase 1-2 (Foundation) + Phase 3-4 (US1+US2) = 29 tasks = Core value delivered

---

## Notes

- All tasks follow strict checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- [P] tasks = different files, no blocking dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- TDD enforced: Tests written and FAIL before implementation (constitution requirement)
- All tests must pass before story considered complete
- Commit after each logical task group
- Verify at checkpoints that story works independently before proceeding
- Follow Next.js 16 App Router patterns throughout
- Maintain TypeScript strict mode compliance
- Ensure bilingual support (EN/TR) via next-intl for all user-facing text
