# Sidebar Testing Guide

## Quick Test Checklist

### 1. URL Detection Tests
Navigate through these routes and verify the correct item is active:

#### Dashboard Root
```
URL: /dashboard/{your-org-id}
Expected: ✅ Dashboard active
```

#### Org Structure Landing
```
URL: /dashboard/{your-org-id}/org-structure
Expected: ✅ Org Structure active (if this route exists)
```

#### Positions Page
```
URL: /dashboard/{your-org-id}/org-structure/positions
Expected: 
- ❌ Dashboard NOT active
- ❌ Org Structure parent NOT active
- ✅ Positions child active
```

#### Departments Page
```
URL: /dashboard/{your-org-id}/org-structure/departments
Expected:
- ❌ Dashboard NOT active
- ❌ Org Structure parent NOT active
- ✅ Departments child active
```

#### Organization Chart
```
URL: /dashboard/{your-org-id}/org-structure/hierarchy
Expected:
- ❌ Dashboard NOT active
- ❌ Org Structure parent NOT active
- ✅ Organization Chart child active
```

#### Other Routes
```
URL: /dashboard/{your-org-id}/questionnaire
Expected: ✅ Questionnaire active

URL: /dashboard/{your-org-id}/settings
Expected: ✅ Settings active
```

### 2. Visual Tests

#### Active State Appearance
- [ ] Active item has subtle primary-colored background
- [ ] Active item has thin border in primary color
- [ ] Active item has vertical indicator bar on left
- [ ] Active item text is primary color
- [ ] Active item icon is slightly larger/bolder
- [ ] Active indicator has subtle glow effect

#### Collapsed State (Default)
- [ ] Sidebar width is 16px (icon-only)
- [ ] Icons are centered and visible
- [ ] Labels are hidden
- [ ] Tooltips appear on hover (200ms delay)
- [ ] Active indicator is visible

#### Expanded State (Hover)
- [ ] Sidebar expands to 60px width smoothly
- [ ] Labels slide in with opacity transition
- [ ] Icons remain in place (no jumping)
- [ ] Child items appear when parent is expanded
- [ ] Chevron icon rotates when parent expands
- [ ] Shadow increases from sm to lg

#### Hover Interactions
- [ ] Icons scale up slightly on hover (scale-105)
- [ ] Background changes to accent/50
- [ ] Text color changes to foreground
- [ ] Transitions are smooth (300ms)

#### Child Items
- [ ] Slightly smaller than parent items
- [ ] Indented with ml-4
- [ ] Smooth slide-down animation when parent expands
- [ ] Active state works correctly
- [ ] Rounded-lg corners (less than parent)

### 3. Theme Tests

#### Light Mode
- [ ] Active state: Light primary background
- [ ] Text: Dark primary color
- [ ] Border: Visible and subtle
- [ ] Indicator bar: Primary color with glow
- [ ] Hover: Gentle accent background

#### Dark Mode
- [ ] Active state: Dark primary background
- [ ] Text: Light primary color
- [ ] Border: Visible and subtle
- [ ] Indicator bar: Primary color with glow
- [ ] Hover: Gentle accent background
- [ ] Backdrop blur looks good

### 4. Interaction Tests

#### Click Behavior
- [ ] Clicking parent with children expands/collapses
- [ ] Clicking child navigates to route
- [ ] Clicking leaf item navigates to route
- [ ] Active state updates immediately after navigation

#### Keyboard Navigation
- [ ] Tab key focuses nav items
- [ ] Arrow keys navigate between items
- [ ] Enter key activates focused item
- [ ] Focus ring is visible and styled correctly

#### Touch/Mobile
- [ ] Sidebar appears as sheet/drawer on mobile
- [ ] Touch targets are adequate (44px minimum)
- [ ] Swipe to close works
- [ ] Active state visible in mobile drawer

### 5. Edge Cases

#### Long Labels
- [ ] Labels don't overflow or wrap
- [ ] Ellipsis appears if needed (shouldn't happen with current items)
- [ ] Tooltip shows full label when collapsed

#### Rapid Hover
- [ ] No jank or flickering
- [ ] Animations complete smoothly
- [ ] Tooltips don't get stuck

#### Navigation During Animation
- [ ] Clicking during expand/collapse works
- [ ] Active state updates correctly mid-animation

#### Browser Back/Forward
- [ ] Active state updates when using browser navigation
- [ ] Auto-expand parent if child becomes active

### 6. Performance Tests

#### Animation Smoothness
- [ ] 60fps animations (no janky transitions)
- [ ] Smooth expand/collapse
- [ ] Smooth child slide animations
- [ ] No repaints on hover (check DevTools)

#### Load Time
- [ ] Sidebar renders immediately on page load
- [ ] No layout shift
- [ ] Icons load without flash

### 7. Accessibility Tests

#### Screen Reader
- [ ] Nav landmark announced correctly
- [ ] Current page announced (aria-current)
- [ ] Parent expansion state announced (aria-expanded)
- [ ] Labels read correctly when collapsed

#### Keyboard Only
- [ ] All items reachable with Tab
- [ ] Focus order is logical
- [ ] Focus visible at all times
- [ ] No keyboard traps

#### High Contrast Mode
- [ ] Active state visible
- [ ] Borders and indicators visible
- [ ] Text readable
- [ ] Focus indicators clear

## Visual Regression Tests

### Screenshots to Take

1. **Collapsed State**
   - Light mode
   - Dark mode

2. **Expanded State**
   - Light mode
   - Dark mode

3. **Active States**
   - Dashboard active
   - Parent with active child
   - Child active
   - Leaf item active

4. **Hover States**
   - Hover on parent
   - Hover on child
   - Hover on leaf

5. **Mobile Drawer**
   - Open state
   - Closed state
   - Active item in drawer

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Common Issues & Solutions

### Issue: Dashboard Always Active
**Solution**: ✅ Fixed! Now only active at exact dashboard root

### Issue: Parent Active When Child Is
**Solution**: ✅ Fixed! Parents not active if child is active

### Issue: Black Background Too Heavy
**Solution**: ✅ Fixed! Now uses subtle primary/10 with border

### Issue: Animations Janky
**Check**: 
- Reduce motion settings in OS
- Hardware acceleration enabled
- No performance throttling in DevTools

### Issue: Tooltips Not Showing
**Check**:
- Hover time (200ms delay)
- Tooltip component working
- Z-index conflicts

## Manual Test Script

```bash
# 1. Start dev server
pnpm dev

# 2. Open browser to localhost:3000

# 3. Login and select an organization

# 4. Navigate to each route and check active state:
# - Dashboard root
# - Org Structure → Positions
# - Org Structure → Departments  
# - Org Structure → Hierarchy
# - Questionnaire
# - Settings

# 5. Toggle dark mode and repeat

# 6. Test mobile view (resize browser or use DevTools)

# 7. Test keyboard navigation

# 8. Test with screen reader (VoiceOver/NVDA)
```

## Automated Test Ideas (Future)

```typescript
describe('Sidebar Active State', () => {
  it('shows dashboard active only at root', () => {
    // Visit /dashboard/{orgId}
    // Expect dashboard to have aria-current="page"
  });

  it('shows child active, not parent', () => {
    // Visit /dashboard/{orgId}/org-structure/positions
    // Expect positions to have aria-current="page"
    // Expect org-structure parent NOT to have aria-current
  });

  it('expands parent when child is active', () => {
    // Visit /dashboard/{orgId}/org-structure/positions
    // Expect parent to have aria-expanded="true"
  });
});
```

## Success Criteria

✅ All URL patterns match correctly
✅ Active states visually clear and elegant
✅ Animations smooth at 60fps
✅ Works in light and dark mode
✅ Mobile drawer functions correctly
✅ Keyboard navigation works
✅ Screen reader accessible
✅ No console errors or warnings

---

**Start Testing**: Open `localhost:3000` and follow the checklist above
**Report Issues**: Note any unexpected behavior or visual issues
**Need Changes**: Let me know and I'll refine the design further

