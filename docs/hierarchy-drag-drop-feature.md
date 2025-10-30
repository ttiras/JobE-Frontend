# Hierarchy Drag & Drop Reorganization Feature

## Overview

Interactive drag & drop functionality for reorganizing department hierarchy with instant visual feedback and batch saving.

## Features Implemented

### 1. **Instant Visual Feedback** ✨
When a user drags a department onto another:
- ✅ Department immediately moves to new position in the tree
- ✅ Hierarchy re-layouts automatically with smooth 800ms animation
- ✅ Amber ring border appears on moved department
- ✅ Pulsing "Pending" badge shows on moved departments
- ✅ Small "Moved ⟳" indicator at bottom of node
- ✅ Animated amber edges connecting to moved departments
- ✅ Grab cursor (👋) shows nodes are draggable

### 2. **Smart Validation** 🛡️
Real-time validation prevents invalid moves:
- ❌ Can't move department under itself
- ❌ Can't create circular references (child can't become parent of its ancestor)
- ❌ Can't exceed max depth of 10 levels
- ✅ Toast notifications explain why moves are invalid

### 3. **Pending Changes System** 📋
- Changes accumulate until user clicks "Save Changes"
- PendingChangesBar appears at bottom showing count
- Preview mode: hierarchy shows how it WILL look after save
- User can continue dragging multiple departments
- "Undo All" clears all pending changes
- "Review" button shows detailed list of all moves

### 4. **Batch Save** 💾
- Single GraphQL mutation updates all moves in one transaction
- Auto-refreshes data after successful save
- Error handling with detailed toast messages
- Loading state during save operation

### 5. **Safety Features** 🔒
- Browser warning if trying to leave page with unsaved changes
- All validation happens before allowing move
- Clear visual distinction between saved vs pending state

## User Experience Flow

```
1. User sees hierarchy with grab cursors on nodes
   ↓
2. Drags department "Finance" onto "Operations"
   ↓
3. ✨ Instant feedback:
   - Finance immediately appears under Operations
   - Tree re-layouts with smooth animation
   - Amber ring + pulsing badge on Finance node
   - Animated amber edge connecting Finance to Operations
   - Toast: "Finance moved from 'Root' to 'Operations'"
   ↓
4. PendingChangesBar slides up: "1 pending move"
   ↓
5. User drags more departments to experiment
   - Each move updates the preview immediately
   - Count increments: "3 pending moves"
   ↓
6. User reviews changes:
   - Clicks "Review" to see list
   - OR clicks "Undo All" to clear everything
   - OR clicks "Save Changes" to commit
   ↓
7. On Save:
   - Loading spinner on button
   - Batch update to database
   - Success toast: "Successfully updated 3 department(s)"
   - Pending indicators disappear
   - Final structure is saved
```

## Visual Indicators

### Normal Department Node
```
┌─────────────────────────────┐
│ 🏢 FINANCE                  │
│ Finance Department          │
│ 👥 5 children • 12 total    │
│ Level ▓▓░░░ 2              │
└─────────────────────────────┘
```

### Pending Move Node
```
┌═════════════════════════════┐ ← Amber ring
║ 🏢 FINANCE [Pending]        ║ ← Pulsing badge
║ Finance Department          ║
║ 👥 5 children • 12 total    ║
║ Level ▓▓░░░ 3              ║ ← New level
╘═══════════════════════════╕═╛
            │ Moved ⟳ │         ← Move indicator
            └─────────┘
```

### Edges
- **Normal**: Gray, static
- **Pending**: Amber (#f59e0b), animated flowing dots

## Technical Implementation

### Key Files
1. **hierarchy-page-client.tsx**
   - `previewDepartments`: Applies pending moves to create instant preview
   - `handleDepartmentMove`: Validates and queues moves
   - `handleSaveChanges`: Batch commits to database

2. **department-hierarchy-visualization.tsx**
   - Drag detection using position overlap algorithm
   - Enriches nodes/edges with pending state styling
   - Console logging for debugging

3. **department-node.tsx**
   - Visual styling: amber ring, pulsing badge, move indicator
   - Grab cursor on hover

### State Management
```typescript
// Simple Map tracks pending changes
pendingMoves: Map<departmentId, newParentId>

// Creates preview by applying pending moves
previewDepartments = departments.map(dept => {
  const newParentId = pendingMoves.get(dept.id);
  return newParentId !== undefined 
    ? { ...dept, parent_id: newParentId }
    : dept;
});
```

### Validation Flow
```typescript
validateDepartmentMove(deptId, newParentId, depts, existingMoves)
  → Check circular reference
  → Check depth limit
  → Check if moving to itself
  → Return { isValid, errors, warnings }
```

## Testing Tips

1. **Try invalid moves** to see validation:
   - Drag a parent under its own child
   - Create very deep nesting (>10 levels)

2. **Test multiple moves**:
   - Drag 3-4 departments
   - Review the list
   - Undo all
   - Drag again and save

3. **Test browser warning**:
   - Make pending changes
   - Try to refresh page
   - Should see "You have unsaved changes"

4. **Check console** for debug logs:
   - 🎯 Drag started
   - 📏 Distance calculations
   - ✅ Drop detected

## Performance Notes

- Drag detection uses O(n) position checking on drop
- Layout regeneration on each move (acceptable for typical org sizes <1000 depts)
- fitView animation set to 800ms for smooth transitions
- No debouncing needed - changes are instant

## Future Enhancements

- [ ] Undo individual moves (not just all)
- [ ] Drag onto empty space to make root
- [ ] Show old parent name in pending changes list
- [ ] Keyboard shortcuts (Ctrl+Z for undo, Ctrl+S for save)
- [ ] Collaborative editing with conflict detection
- [ ] Bulk select and move multiple departments at once

## Debug Commands

```javascript
// In browser console while on hierarchy page:
console.log('Pending moves:', pendingMoves);
console.log('Preview departments:', previewDepartments);

// Check if drag handlers are attached:
document.querySelector('[data-id]') // Should find node elements
```

---

**Built**: October 30, 2025  
**Status**: ✅ Fully Functional  
**User Feedback**: "Wow that looks really great!"
