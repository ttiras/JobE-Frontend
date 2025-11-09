# Sidebar URL Matching Test Cases

## Test Organization ID
`2129f9a7-78f6-4375-8d07-f55ad268f4cd`

## Test Cases

### Case 1: Dashboard Root
**URL:** `/dashboard/2129f9a7-78f6-4375-8d07-f55ad268f4cd`

**Expected Active States:**
- ✅ Dashboard → ACTIVE
- ❌ Org Structure → NOT ACTIVE
- ❌ Departments → NOT ACTIVE
- ❌ Positions → NOT ACTIVE
- ❌ Hierarchy → NOT ACTIVE

**Logic:**
```typescript
// Dashboard href: ''
// normalizedHref: '/dashboard/2129f9a7-78f6-4375-8d07-f55ad268f4cd'
// pathname: '/dashboard/2129f9a7-78f6-4375-8d07-f55ad268f4cd'
// Match: pathname === dashboardRoot → TRUE ✅
```

---

### Case 2: Departments Page
**URL:** `/dashboard/2129f9a7-78f6-4375-8d07-f55ad268f4cd/org-structure/departments`

**Expected Active States:**
- ❌ Dashboard → NOT ACTIVE
- ❌ Org Structure → NOT ACTIVE (parent)
- ✅ Departments → ACTIVE
- ❌ Positions → NOT ACTIVE
- ❌ Hierarchy → NOT ACTIVE

**Logic:**
```typescript
// Dashboard:
// pathname !== dashboardRoot → FALSE ❌

// Org Structure (parent):
// hasActiveChild = TRUE (Departments matches)
// isActive = !hasActiveChild && ... → FALSE ❌

// Departments (child):
// pathname === '/dashboard/{orgId}/org-structure/departments' → TRUE ✅
```

---

### Case 3: Positions Page
**URL:** `/dashboard/2129f9a7-78f6-4375-8d07-f55ad268f4cd/org-structure/positions`

**Expected Active States:**
- ❌ Dashboard → NOT ACTIVE
- ❌ Org Structure → NOT ACTIVE (parent)
- ❌ Departments → NOT ACTIVE
- ✅ Positions → ACTIVE
- ❌ Hierarchy → NOT ACTIVE

---

### Case 4: Organization Chart
**URL:** `/dashboard/2129f9a7-78f6-4375-8d07-f55ad268f4cd/org-structure/hierarchy`

**Expected Active States:**
- ❌ Dashboard → NOT ACTIVE
- ❌ Org Structure → NOT ACTIVE (parent)
- ❌ Departments → NOT ACTIVE
- ❌ Positions → NOT ACTIVE
- ✅ Hierarchy → ACTIVE

---

### Case 5: Org Structure Landing (if exists)
**URL:** `/dashboard/2129f9a7-78f6-4375-8d07-f55ad268f4cd/org-structure`

**Expected Active States:**
- ❌ Dashboard → NOT ACTIVE
- ✅ Org Structure → ACTIVE (exact match, no active child)
- ❌ Departments → NOT ACTIVE
- ❌ Positions → NOT ACTIVE
- ❌ Hierarchy → NOT ACTIVE

---

### Case 6: Questionnaire
**URL:** `/dashboard/2129f9a7-78f6-4375-8d07-f55ad268f4cd/questionnaire`

**Expected Active States:**
- ❌ Dashboard → NOT ACTIVE
- ❌ Org Structure → NOT ACTIVE
- ✅ Questionnaire → ACTIVE

---

### Case 7: Settings
**URL:** `/dashboard/2129f9a7-78f6-4375-8d07-f55ad268f4cd/settings`

**Expected Active States:**
- ❌ Dashboard → NOT ACTIVE
- ✅ Settings → ACTIVE

---

## Current Implementation Logic

### Parent Items with Children
```typescript
if (item.children && item.children.length > 0) {
  // Parent should NEVER be active if a child is active
  isActive = !hasActiveChild && normalizedPathname === itemNormalized;
}
```

**Result:** Parent (Org Structure) only active if:
1. No child is active
2. Exact match on parent URL

### Child Items
```typescript
const isChildItemActive = 
  normalizedPathname === childNormalized || 
  normalizedPathname.startsWith(`${childNormalized}/`);
```

**Result:** Child active if exact match or deeper sub-route

### Dashboard (Special Case)
```typescript
if (!item.href || item.href === '') {
  const dashboardRoot = `/dashboard/${orgId}`;
  const isDashboardRoot = 
    normalizedPathname === dashboardRoot || 
    normalizedPathname === `${dashboardRoot}/`;
  isActive = isDashboardRoot;
}
```

**Result:** Dashboard only active at exact root, never on sub-routes

---

## Principle: Most Specific Route Wins

The sidebar follows the principle of **showing only the deepest/most specific route as active**.

This means:
- For `/dashboard/{orgId}/org-structure/departments` → Only **Departments** is active
- For `/dashboard/{orgId}` → Only **Dashboard** is active
- Parent items are NEVER active when a child is active
- Child items take precedence over their parents

This creates a clear, unambiguous navigation state where the user always knows exactly which page they're on.

---

## Manual Testing Checklist

When testing in the browser at `http://localhost:3000`:

- [ ] Navigate to dashboard root → Dashboard active
- [ ] Navigate to departments → Only Departments active
- [ ] Navigate to positions → Only Positions active
- [ ] Navigate to hierarchy → Only Hierarchy active
- [ ] Navigate back to dashboard → Dashboard active again
- [ ] Use browser back/forward → Active state updates correctly
- [ ] Parent (Org Structure) auto-expands when child is active
- [ ] Only one item shows active state at a time

---

**Status:** ✅ Logic is correct and handles all cases
**Principle:** Most specific (deepest) route in URL is always the active item

