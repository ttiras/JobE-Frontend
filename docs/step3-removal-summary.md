# Import Wizard Step 3 Removal

**Date:** 2025-10-30  
**Change Type:** UX Improvement - Streamlined Import Flow

## Problem

The import wizard had a redundant Step 3 ("Review & Confirm") that showed the same summary statistics already visible in Step 2 ("Data Preview & Validation"). This created unnecessary friction in the import workflow.

**Old Flow (4 steps):**
1. Template & Upload
2. Data Preview & Validation ➜ "Continue to Review" button
3. Review & Confirm (redundant summary) ➜ "Confirm & Import" button
4. Import Complete

## Solution

Removed Step 3 entirely and moved the "Confirm & Import" action directly into Step 2.

**New Flow (3 steps):**
1. Template & Upload
2. Data Preview & Validation ➜ "Confirm & Import" button (triggers import immediately)
3. Import Complete

## Changes Made

### 1. Import Wizard Component (`components/import/import-wizard.tsx`)

**Removed:**
- Import of `ImportWizardStep3` component
- `handleStep2Next()` and `handleStep3Confirm()` functions
- Step 3 rendering in the wizard

**Changed:**
- `totalSteps`: 4 → 3
- Step indicator arrays: `[1, 2, 3, 4]` → `[1, 2, 3]`
- Auto-advance logic: Success transitions from step 2 → 3 (instead of 3 → 4)
- Step 2 now calls `onConfirm` (executes import) instead of `onNext` (navigates to step 3)

**Added:**
- `handleStep2Confirm()`: Merged confirm logic directly into Step 2 handler

### 2. Step 2 Component (`components/import/import-wizard-step2.tsx`)

**Changed:**
- Props interface: `onNext` → `onConfirm`
- Button label: "Continue to Review" → "Confirm & Import"
- Button style: Added `size="lg"` and `min-w-[160px]` for prominence
- Component description: Now mentions "confirm to proceed with import"

### 3. English Translations (`messages/en.json`)

**Updated wizard.steps:**
```json
"step2": {
  "description": "Review your data and confirm to proceed with import",
  "label": "Preview"
},
"step3": {
  "title": "Import Complete",
  "description": "Your data has been successfully imported",
  "label": "Complete"
}
```

**Removed step4 from wizard.steps** (but kept step4 translations for the success component)

**Updated wizard.step2:**
- Added: `"confirmButton": "Confirm & Import"`
- Removed: `"nextButton": "Continue to Review"`

### 4. Turkish Translations (`messages/tr.json`)

**Updated wizard.steps:**
```json
"step2": {
  "description": "Verilerinizi gözden geçirin ve içe aktarmayı onaylayın",
  "label": "Önizleme"
},
"step3": {
  "title": "İçe Aktarma Tamamlandı",
  "description": "Verileriniz başarıyla içe aktarıldı",
  "label": "Tamamlandı"
}
```

**Updated wizard.step2:**
- Added: `"confirmButton": "Onayla ve İçe Aktar"`
- Removed: `"nextButton": "İncelemeye Devam Et"`

## Files Modified

1. `components/import/import-wizard.tsx` (361 → 353 lines)
2. `components/import/import-wizard-step2.tsx` (253 lines)
3. `messages/en.json`
4. `messages/tr.json`

## Files NOT Changed

- `components/import/import-wizard-step3.tsx` - Left in codebase but no longer referenced
- `components/import/import-wizard-step4.tsx` - Now serves as Step 3 (Success page)
- `components/import/import-wizard-step1.tsx` - Unchanged

## User Experience Impact

### Before
1. User uploads file
2. User reviews data with validation
3. User clicks "Continue to Review"
4. User sees same summary again in Step 3
5. User clicks "Confirm & Import"
6. Success page

### After
1. User uploads file
2. User reviews data with validation
3. User clicks "Confirm & Import" (single action)
4. Success page

**Benefits:**
- ✅ Reduced clicks: 5 → 4 steps
- ✅ Eliminated redundant review screen
- ✅ Faster import workflow
- ✅ Clearer user intent (single confirmation point)
- ✅ More prominent "Confirm & Import" button

## Testing Checklist

- [ ] Step 1: Upload file and verify auto-navigation to Step 2
- [ ] Step 2: Verify "Confirm & Import" button appears
- [ ] Step 2: Verify button is disabled when errors present
- [ ] Step 2: Click confirm and verify import executes
- [ ] Step 3: Verify success page displays correctly
- [ ] Step indicators: Verify 3 steps shown (not 4)
- [ ] Mobile view: Verify step dots show 3 steps
- [ ] Both languages: Verify English and Turkish translations correct

## Related Context

This change complements recent improvements to the import wizard:
- Seamless single-drop upload flow (no duplicate file selection)
- Scrollable data preview tables (max 10 visible rows)
- Comprehensive validation with hierarchy checks
- Excel-style format preview with column letters/row numbers

## Rollback Plan

If needed, revert changes by:
1. Restore Step 3 import in `import-wizard.tsx`
2. Change `onConfirm` back to `onNext` in Step 2
3. Restore `handleStep2Next()` and `handleStep3Confirm()` functions
4. Update `totalSteps` back to 4
5. Restore step arrays to `[1, 2, 3, 4]`
6. Revert translation changes

Estimated rollback time: 5 minutes
