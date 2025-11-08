# Test Fix Plan

**Date**: Current  
**Status**: 114 failed, 365 passed, 479 total  
**Goal**: Fix all failing tests before committing

## Overview

This document outlines a systematic approach to fix all failing tests. Tests are categorized by failure type and priority.

## Test Failure Categories

### Category 1: API/Mock Mismatches (High Priority)
**Impact**: 12 tests  
**Root Cause**: Tests expect different API than implementation

#### 1.1 Server Client Tests (`tests/unit/server-client.test.ts`)
- **Issue**: Tests import `createServerClient` but implementation uses `NhostSDK.createServerClient`
- **Fix Strategy**: Update test mocks to match actual Nhost SDK API
- **Files to Fix**:
  - `tests/unit/server-client.test.ts`
  - Mock `@nhost/nhost-js` module correctly

#### 1.2 Session Refresh Tests (`tests/unit/session-refresh.test.ts`)
- **Issue**: Exponential backoff retry logic expectations don't match implementation
- **Fix Strategy**: Review actual retry implementation and align test expectations
- **Files to Fix**:
  - `tests/unit/session-refresh.test.ts`
  - `lib/hooks/use-session-refresh.ts` (verify implementation)

### Category 2: Integration Test Failures (High Priority)
**Impact**: 11 tests  
**Root Cause**: Mock functions or test data don't match actual behavior

#### 2.1 Import Confirmation Flow (`tests/integration/import/confirm-flow.test.ts`)
- **Issues**:
  - Rollback on failure
  - Progress event emission
  - Data validation before execution
  - State cleanup
- **Fix Strategy**: Review mock implementations and ensure they match actual hook behavior

#### 2.2 Import Upload Flow (`tests/integration/import/upload-flow.test.ts`)
- **Issues**:
  - Valid file processing
  - Validation error detection
  - Data type handling
  - Performance with large files
  - Edge cases (empty files)
- **Fix Strategy**: Verify test data matches expected schema and mock functions are correct

### Category 3: Component Test Failures (Medium Priority)
**Impact**: ~20+ tests  
**Root Cause**: Styling, responsive behavior, or component API changes

#### 3.1 Layout Components
- **NavItem** (`components/layout/__tests__/nav-item.test.tsx`)
  - Active styles
  - Hover states
- **Header** (`components/layout/__tests__/header.test.tsx`)
  - Logo link rendering
- **Sidebar Responsive** (`components/layout/__tests__/sidebar-responsive.test.tsx`)
  - Desktop/tablet/mobile behavior
  - State management
- **Sidebar Keyboard** (`components/layout/__tests__/sidebar-keyboard.test.tsx`)
  - Keyboard navigation

#### 3.2 Auth Components
- **CAPTCHA** (`components/auth/__tests__/captcha.test.tsx`)
  - Error handling for missing grecaptcha

#### 3.3 Import Components
- **Import Confirmation Dialog** (`tests/unit/components/import-confirmation-dialog.test.tsx`)
  - Text matching issues ("0 total" not found)

### Category 4: Test Data/Assertion Issues (Low Priority)
**Impact**: Various  
**Root Cause**: Test expectations too strict or outdated

## Fix Strategy

### Phase 1: Fix API/Mock Mismatches (Priority 1)
1. **Fix server-client.test.ts**
   - Update mock for `@nhost/nhost-js` to export `createServerClient`
   - Ensure mock matches actual SDK structure
   - Verify all 12 tests pass

2. **Fix session-refresh.test.ts**
   - Review retry logic implementation
   - Fix exponential backoff test expectations
   - Verify retry count and timing

**Estimated Time**: 1-2 hours  
**Expected Result**: 14 tests fixed

### Phase 2: Fix Integration Tests (Priority 2)
1. **Review import workflow implementation**
   - Check `hooks/useImportWorkflow.ts`
   - Verify mock functions match actual behavior
   - Update test expectations if needed

2. **Fix confirm-flow.test.ts**
   - Verify rollback logic
   - Check progress event emission
   - Fix state cleanup assertions

3. **Fix upload-flow.test.ts**
   - Verify test data matches schema
   - Check validation logic
   - Fix edge case handling

**Estimated Time**: 2-3 hours  
**Expected Result**: 11 tests fixed

### Phase 3: Fix Component Tests (Priority 3)
1. **Fix layout component tests**
   - Update styling assertions (may need snapshot updates)
   - Fix responsive behavior mocks
   - Verify component API hasn't changed

2. **Fix auth component tests**
   - Update CAPTCHA error handling test
   - Verify grecaptcha mock

3. **Fix import component tests**
   - Fix text matching in confirmation dialog
   - Update assertions to match actual rendered output

**Estimated Time**: 2-3 hours  
**Expected Result**: ~20 tests fixed

### Phase 4: Verification (Priority 4)
1. Run full test suite
2. Verify all tests pass
3. Check test coverage hasn't decreased
4. Update any outdated test documentation

**Estimated Time**: 30 minutes

## Implementation Guidelines

### Before Fixing Each Test
1. **Read the test** - Understand what it's testing
2. **Read the implementation** - Understand actual behavior
3. **Identify the mismatch** - Determine if test or code needs fixing
4. **Fix appropriately** - Update test if expectations wrong, fix code if bug exists

### Decision Framework: Fix Test vs Fix Code

**Fix the Test if**:
- Test expectations are outdated
- Mock is incorrect
- Test data doesn't match schema
- Assertion is too strict (e.g., exact text match when partial is fine)

**Fix the Code if**:
- Implementation has a bug
- Feature is incomplete
- Behavior doesn't match requirements
- Type errors or runtime errors

### Testing Best Practices
- Run tests frequently during fixes
- Fix one category at a time
- Commit after each category is fixed
- Write clear commit messages explaining fixes

## Success Criteria

✅ All 479 tests pass  
✅ Test coverage maintained or improved  
✅ No new TypeScript errors  
✅ CI pipeline passes  
✅ All fixes documented

## Next Steps

1. Start with Phase 1 (API/Mock Mismatches)
2. Work through phases sequentially
3. Run full test suite after each phase
4. Commit fixes incrementally
5. Update this document with progress

## Notes

- Some tests may have been written before implementation (TDD approach)
- Some failures may indicate actual bugs that need fixing
- Prioritize fixing tests that indicate real bugs over outdated expectations
- Keep test quality high - don't just make tests pass, ensure they test correctly

