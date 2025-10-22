# Implementation Plan: Dashboard Shell & Navigation

**Feature Branch**: `001-dashboard-shell`  
**Created**: 2025-10-22  
**Status**: Ready for Implementation  
**Technology Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui

## Technology Choices

### Core Framework & Libraries

- **Next.js 14** with App Router for server-side rendering and routing
- **TypeScript** (strict mode) for type safety
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for pre-built, accessible components (default color theme)
- **next-themes** for light/dark mode support
- **next-intl** for internationalization (English/Turkish)
- **Lucide React** for icons (included with shadcn/ui)

### shadcn/ui Components to Use

- `Sheet` - Mobile navigation overlay
- `DropdownMenu` - Organization selector, language selector, user menu
- `Button` - Navigation items, action buttons
- `Separator` - Visual dividers in navigation
- `Skeleton` - Loading states during org switching
- `Avatar` - User profile display
- `Badge` - Status indicators, role badges
- `Tooltip` - Icon-only navigation on tablet
- `ScrollArea` - Scrollable navigation on mobile

### Theme Configuration

- **Color Scheme**: shadcn/ui default (slate)
- **Mode Support**: Light mode (default) + Dark mode
- **Responsive Breakpoints**: Tailwind defaults (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)

---

## Implementation Phases

### Phase 1: Foundation Setup (Days 1-2)

**Objective**: Set up project infrastructure with Next.js, Tailwind, shadcn/ui, and theming.

#### Tasks

1. **Initialize Next.js Project**
   - Run `pnpm create next-app@latest` with TypeScript, App Router, Tailwind CSS
   - Configure `tsconfig.json` with strict mode
   - Set up project structure: `app/`, `components/`, `lib/`, `hooks/`, `config/`
   - **Tests**: Verify dev server runs, TypeScript compiles without errors

2. **Install & Configure shadcn/ui**
   - Run `pnpm dlx shadcn@latest init` (select default theme, slate colors)
   - Install required components: `Sheet`, `DropdownMenu`, `Button`, `Separator`, `Skeleton`, `Avatar`, `Badge`, `Tooltip`, `ScrollArea`
   - Configure `components.json` with default settings
   - **Tests**: Verify component imports work, Tailwind classes apply correctly

3. **Set Up Theme Provider (Light/Dark Mode)**
   - Install `next-themes` package
   - Create `components/providers/theme-provider.tsx` wrapping `ThemeProvider`
   - Add theme toggle component using shadcn/ui `DropdownMenu`
   - Configure Tailwind for dark mode (`class` strategy)
   - Add theme persistence in localStorage
   - **Tests**: 
     - Theme toggle switches between light/dark
     - Theme persists across page refresh
     - All shadcn/ui components render correctly in both modes

4. **Set Up Internationalization (i18n)**
   - Install `next-intl` package
   - Create `messages/en.json` and `messages/tr.json` for translations
   - Configure `app/[locale]/layout.tsx` for locale routing (with optional locale parameter)
   - Configure middleware to omit default locale (en) from URLs: `/dashboard` instead of `/en/dashboard`
   - Turkish URLs explicitly include locale: `/tr/dashboard`
   - Create language switcher component using `DropdownMenu`
   - Add locale middleware for URL handling with default locale detection
   - **Tests**:
     - Root URL `/` and `/dashboard` load in English (default)
     - Navigate to `/tr/dashboard` for Turkish
     - Language switcher redirects: English → `/dashboard`, Turkish → `/tr/dashboard`
     - Locale persists in URL across navigation (no `/en/` prefix for English)
     - Fallback to English for missing translations

5. **Create Base Layout Structure**
   - Create `app/[locale]/(dashboard)/layout.tsx` for authenticated pages
   - Define layout slots: header, sidebar, main content
   - Add metadata configuration (title, description, viewport)
   - **Tests**: Layout renders with correct HTML structure, viewport meta tag present

**Deliverables**:
- ✅ Next.js project with TypeScript strict mode
- ✅ shadcn/ui configured with default theme
- ✅ Light/dark mode working with persistence
- ✅ English/Turkish i18n working with URL-based routing
- ✅ Base layout structure defined

**Risks & Mitigations**:
- **Risk**: next-intl routing conflicts with Next.js 14 App Router
  - *Mitigation*: Use middleware-based routing, test locale switching early
- **Risk**: shadcn/ui components have accessibility issues
  - *Mitigation*: Run axe DevTools on all components, fix violations immediately

---

### Phase 2: Header & Organization Context (Days 3-4)

**Objective**: Build header with organization selector, user menu, language switcher, and theme toggle.

#### Tasks

1. **Create Header Component**
   - Build `components/layout/header.tsx` with shadcn/ui `Button` and `DropdownMenu`
   - Add logo/wordmark (link to home)
   - Position: sticky top-0 with backdrop blur
   - **Tests**:
     - Header renders at top of page
     - Logo links to dashboard home
     - Header remains visible when scrolling

2. **Build Organization Selector**
   - Create `components/layout/org-selector.tsx` using `DropdownMenu`
   - Display current org name with dropdown arrow
   - Show list of accessible orgs in dropdown
   - Add search input for >10 organizations
   - Handle single-org case (no dropdown)
   - **Tests**:
     - Dropdown opens on click
     - Selecting org updates context immediately (optimistic UI)
     - Search filters organization list
     - Single-org users see non-clickable org name
     - Keyboard navigation works (arrow keys, Enter to select)

3. **Implement Organization Context**
   - Create `lib/contexts/organization-context.tsx` with React Context
   - Store: current org ID, name, logo, user role
   - Persist in localStorage (`jobe_current_org`)
   - Add optimistic update + background sync pattern
   - **Tests**:
     - Context provides current org to all components
     - Switching orgs updates context immediately
     - Loading state shown on data-dependent sections
     - Context persists across page refresh
     - Context available to server components via cookies

4. **Build User Menu**
   - Create `components/layout/user-menu.tsx` using `DropdownMenu`
   - Display user avatar and name
   - Menu items: Profile, Settings, Logout
   - Add role badge (Admin/HR Manager/Viewer)
   - **Tests**:
     - Menu opens on avatar click
     - All menu items are clickable
     - Role badge displays correct role
     - Keyboard accessible (Tab, Enter, Escape)

5. **Add Language & Theme Toggles**
   - Create `components/layout/language-switcher.tsx` using `DropdownMenu`
   - Options: English (flag icon), Türkçe (flag icon)
   - Create `components/layout/theme-toggle.tsx` with Sun/Moon icons
   - Position both in header (right side)
   - **Tests**:
     - Language switcher updates all UI text immediately
     - Theme toggle switches light/dark mode
     - Both preferences persist across sessions
     - Icons update based on current selection

6. **Add Loading States**
   - Use shadcn/ui `Skeleton` for org switching
   - Show loading spinner on header during org change
   - Implement optimistic UI pattern
   - **Tests**:
     - Skeleton appears immediately when org is switched
     - Header updates optimistically (no delay)
     - Loading state disappears after API response

**Deliverables**:
- ✅ Sticky header with logo, org selector, user menu, language toggle, theme toggle
- ✅ Organization context with optimistic updates
- ✅ Loading states during org switching
- ✅ Multi-org support with search (for >10 orgs)
- ✅ Light/dark mode toggle in header

**Risks & Mitigations**:
- **Risk**: Optimistic UI causes flashing when API fails
  - *Mitigation*: Add error boundary, revert to previous org on failure with error toast
- **Risk**: Organization context not available in server components
  - *Mitigation*: Use cookies for SSR, sync with client-side context

---

### Phase 3: Sidebar Navigation (Days 5-7)

**Objective**: Build responsive sidebar with navigation items, role-based filtering, and accessibility.

#### Tasks

1. **Create Sidebar Layout**
   - Build `components/layout/sidebar.tsx` with fixed positioning
   - Desktop (≥1024px): Always visible, 256px width
   - Tablet (768-1024px): Collapsed to icons (64px width), expand on hover
   - Mobile (<768px): Hidden, opens as Sheet overlay
   - **Tests**:
     - Sidebar renders at correct width on each viewport
     - Sidebar position: fixed on desktop, overlay on mobile
     - Z-index correct (sidebar above content, header above sidebar)

2. **Build Navigation Items**
   - Create `components/layout/nav-item.tsx` using shadcn/ui `Button` variant="ghost"
   - Items: Dashboard, Organizations, Positions, Questionnaire, Analytics, Settings
   - Each with Lucide icon: Home, Building2, Briefcase, ClipboardList, BarChart3, Settings
   - Active state: Highlight with background color + border
   - **Tests**:
     - All 6 nav items render with icons and labels
     - Clicking nav item navigates to correct route
     - Active item highlighted based on current route
     - Hover state shows on all items

3. **Implement Responsive Behavior**
   - Desktop: Full sidebar always visible
   - Tablet: Collapse to icons only, expand on hover (use `Tooltip` for labels)
   - Mobile: Use shadcn/ui `Sheet` component for overlay menu
   - Add hamburger menu button in header (mobile only)
   - **Tests**:
     - Resize browser window to test breakpoints
     - Tablet sidebar shows tooltips on hover
     - Mobile menu opens/closes smoothly with animation
     - Mobile menu closes when clicking outside or pressing Escape

4. **Add Role-Based Filtering**
   - Create `lib/utils/navigation-filter.ts` with role permission logic
   - Define navigation permissions per role (Admin, HR Manager, Viewer)
   - Filter nav items based on user's role in current org
   - **Tests**:
     - Admin sees all navigation items
     - HR Manager sees Dashboard, Organizations, Positions, Questionnaire, Analytics (no Settings)
     - Viewer sees Dashboard, Organizations, Positions, Analytics (no Questionnaire, Settings)
     - Direct URL access redirects to home with error message for unauthorized routes

5. **Implement Keyboard Navigation**
   - Focus management: Tab through nav items in logical order
   - Arrow keys: Navigate up/down through items
   - Enter/Space: Activate focused item
   - Escape: Close mobile menu (if open)
   - **Tests**:
     - Tab key moves focus to first nav item
     - Arrow keys navigate between items
     - Visible focus indicator on all items
     - Enter key navigates to focused item
     - Focus trapped in mobile menu when open

6. **Add ARIA Labels & Landmarks**
   - Sidebar: `<nav aria-label="Main navigation">`
   - Mobile menu: `<Sheet aria-label="Mobile navigation menu">`
   - Nav items: aria-current="page" for active item
   - Icons: aria-hidden="true" (labels handle accessibility)
   - **Tests**:
     - Screen reader announces "Main navigation" landmark
     - Active item announced as "current page"
     - Mobile menu announced correctly when opened
     - All nav items have accessible names

7. **Add Collapse/Expand Functionality**
   - Desktop: Add toggle button to collapse/expand sidebar
   - Persist state in localStorage (`jobe_sidebar_collapsed`)
   - Animate transition (width change)
   - **Tests**:
     - Toggle button collapses sidebar to icon-only view
     - State persists across page refresh
     - Animation smooth (no layout shifts)
     - Content area adjusts width accordingly

**Deliverables**:
- ✅ Responsive sidebar (full on desktop, icons on tablet, overlay on mobile)
- ✅ 6 navigation items with icons and active state highlighting
- ✅ Role-based navigation filtering
- ✅ Keyboard navigation and focus management
- ✅ ARIA labels and landmarks for screen readers
- ✅ Collapse/expand functionality with persistence

**Risks & Mitigations**:
- **Risk**: Sidebar animation causes layout jank
  - *Mitigation*: Use CSS transitions, test with Chrome DevTools Performance tab
- **Risk**: Role-based filtering exposes routes via URL
  - *Mitigation*: Add middleware to verify permissions, redirect unauthorized access

---

### Phase 4: Routing & Page Structure (Days 8-9)

**Objective**: Set up Next.js routing with layout persistence and breadcrumb navigation.

#### Tasks

1. **Create Dashboard Pages**
   - `app/[locale]/(dashboard)/page.tsx` - Dashboard home
   - `app/[locale]/(dashboard)/organizations/page.tsx` - Organizations list
   - `app/[locale]/(dashboard)/positions/page.tsx` - Positions list
   - `app/[locale]/(dashboard)/questionnaire/page.tsx` - Questionnaire builder
   - `app/[locale]/(dashboard)/analytics/page.tsx` - Analytics dashboard
   - `app/[locale]/(dashboard)/settings/page.tsx` - Settings page
   - Add placeholder content for each page (will be built in future features)
   - **Tests**:
     - Navigate to each route via sidebar
     - Active nav item updates based on current route
     - Layout persists (header/sidebar don't re-render)
     - Page title updates in browser tab

2. **Implement Breadcrumb Component**
   - Create `components/layout/breadcrumb.tsx`
   - Generate breadcrumbs based on current route
   - Format: Home > Organizations > [Org Name]
   - Make each segment clickable (except last)
   - **Tests**:
     - Breadcrumbs render on all pages
     - Clicking segment navigates to that level
     - Last segment is not clickable
     - Breadcrumbs update when route changes

3. **Add Page Titles & Metadata**
   - Use Next.js `generateMetadata` for each page
   - Format: "[Page Name] | JobE"
   - Add meta descriptions for SEO
   - **Tests**:
     - Browser tab title updates when navigating
     - Meta tags present in HTML head
     - Open Graph tags configured

4. **Implement Route Guards**
   - Create middleware for role-based route protection
   - Redirect unauthorized users to dashboard home
   - Show error toast with permission denied message
   - **Tests**:
     - Viewer cannot access /settings or /questionnaire
     - HR Manager cannot access /settings
     - Attempting direct URL access shows error and redirects
     - Error logged with unique error ID (FR-022)

5. **Add Loading States**
   - Create `loading.tsx` for each route segment
   - Use shadcn/ui `Skeleton` for content placeholders
   - **Tests**:
     - Loading skeleton shows during navigation
     - Skeleton matches expected layout
     - Loading disappears when page loads

**Deliverables**:
- ✅ 6 dashboard pages with routing
- ✅ Breadcrumb navigation on all pages
- ✅ Page titles and metadata
- ✅ Role-based route guards with error handling
- ✅ Loading states for all routes

**Risks & Mitigations**:
- **Risk**: Route changes re-render entire layout
  - *Mitigation*: Use Next.js layout groups, verify React DevTools shows no layout re-renders
- **Risk**: Breadcrumbs don't update immediately
  - *Mitigation*: Use `usePathname` hook, test breadcrumb updates on every navigation

---

### Phase 5: Error Handling & Logging (Day 10)

**Objective**: Implement comprehensive error handling with logging and user-friendly messages.

#### Tasks

1. **Create Error Boundary**
   - Build `app/[locale]/(dashboard)/error.tsx` with error boundary
   - Show user-friendly error message with unique error ID
   - Add "Try Again" button to reset error
   - Log error details to console (future: send to monitoring service)
   - **Tests**:
     - Throw error in component, verify error boundary catches it
     - Error ID displayed to user
     - Error details logged with stack trace
     - "Try Again" button resets error state

2. **Implement Error Logging Utility**
   - Create `lib/utils/error-logger.ts`
   - Generate unique error IDs (UUID or timestamp-based)
   - Log format: `[ERROR_ID] [timestamp] [error_type] [message] [stack]`
   - Future-ready for external logging service integration
   - **Tests**:
     - Call logger with error, verify console output
     - Error ID is unique for each error
     - Stack trace captured correctly

3. **Add Error Messages to i18n**
   - Add error messages to `messages/en.json` and `messages/tr.json`
   - Keys: `errors.orgSwitchFailed`, `errors.navigationFailed`, `errors.translationLoadFailed`, `errors.permissionDenied`
   - Include placeholder for error ID: "{errorId}"
   - **Tests**:
     - Trigger each error type
     - Verify correct translated message shown
     - Error ID interpolated correctly

4. **Add Toast Notifications**
   - Install `sonner` for toast notifications (works well with shadcn/ui)
   - Create `components/ui/toaster.tsx` wrapper
   - Show error toasts for critical failures
   - **Tests**:
     - Trigger org switch error, verify toast appears
     - Toast shows error message with error ID
     - Toast auto-dismisses after 5 seconds
     - Toast visible in both light and dark modes

5. **Handle Network Errors**
   - Create `lib/utils/api-client.ts` with error handling
   - Retry logic for transient failures (3 retries with exponential backoff)
   - Show offline indicator when network unavailable
   - **Tests**:
     - Disconnect network, verify offline indicator shows
     - Simulate API failure, verify retry attempts
     - Verify error logged after all retries fail

**Deliverables**:
- ✅ Error boundary with user-friendly messages
- ✅ Error logging utility with unique error IDs
- ✅ Translated error messages (EN/TR)
- ✅ Toast notifications for errors
- ✅ Network error handling with retry logic

**Risks & Mitigations**:
- **Risk**: Error logging exposes sensitive data
  - *Mitigation*: Sanitize error messages, never log tokens or PII
- **Risk**: Too many toasts overwhelm user
  - *Mitigation*: Deduplicate errors, limit max visible toasts to 3

---

### Phase 6: Testing & Accessibility Audit (Days 11-12)

**Objective**: Write comprehensive tests and ensure WCAG 2.1 AA compliance.

#### Tasks

1. **Unit Tests - Components**
   - Test `header.tsx`: renders logo, org selector, user menu, language toggle, theme toggle
   - Test `sidebar.tsx`: renders nav items, highlights active item, filters by role
   - Test `org-selector.tsx`: opens dropdown, updates context on selection
   - Test `language-switcher.tsx`: changes locale, updates URL
   - Test `theme-toggle.tsx`: switches light/dark mode
   - **Coverage Target**: 80%+ for all components

2. **Integration Tests - Flows**
   - Test navigation: click nav item → route changes → active item updates
   - Test org switching: select org → context updates → API called → loading state → data updates
   - Test language switching: select language → all UI text updates → URL changes → preference persists
   - Test theme switching: toggle theme → colors update → preference persists
   - **Tools**: React Testing Library, Jest

3. **E2E Tests - User Scenarios**
   - Test User Story 1: Navigate between all 6 sections
   - Test User Story 3: Switch organizations and verify context persists
   - Test User Story 4: Switch language and verify UI updates
   - Test User Story 6: Keyboard navigation through all interactive elements
   - **Tools**: Playwright

4. **Accessibility Audit**
   - Run axe DevTools on all pages
   - Test with screen reader (VoiceOver on macOS)
   - Verify keyboard navigation (Tab, Shift+Tab, Enter, Space, Escape, Arrow keys)
   - Check color contrast (WCAG AA: 4.5:1 for text, 3:1 for UI components)
   - Verify focus indicators visible on all interactive elements
   - **Tools**: axe DevTools, Lighthouse, VoiceOver

5. **Responsive Testing**
   - Test on desktop (1920x1080, 1366x768)
   - Test on tablet (iPad: 768x1024, iPad Pro: 1024x1366)
   - Test on mobile (iPhone SE: 375x667, iPhone 14: 390x844, Galaxy S21: 360x800)
   - Verify no horizontal scrolling, no layout breaks
   - **Tools**: Chrome DevTools Device Mode, real devices

6. **Performance Testing**
   - Lighthouse audit: Performance, Accessibility, Best Practices, SEO (all ≥90)
   - First Contentful Paint (FCP): <1.8s
   - Largest Contentful Paint (LCP): <2.5s
   - Cumulative Layout Shift (CLS): <0.1
   - Test org switching time: <2 seconds (95th percentile)
   - **Tools**: Lighthouse, Chrome DevTools Performance tab

**Deliverables**:
- ✅ 30+ unit tests covering all components
- ✅ 10+ integration tests covering user flows
- ✅ 6+ E2E tests covering user stories
- ✅ WCAG 2.1 AA compliance verified
- ✅ Responsive design tested on 6+ devices
- ✅ Performance metrics meet success criteria

**Risks & Mitigations**:
- **Risk**: Tests are flaky (fail intermittently)
  - *Mitigation*: Use waitFor utilities, avoid hardcoded timeouts, mock API responses
- **Risk**: Accessibility violations found late
  - *Mitigation*: Run axe DevTools continuously during development, not just at end

---

### Phase 7: Documentation & Refinement (Day 13)

**Objective**: Document components, create usage examples, and polish UX.

#### Tasks

1. **Component Documentation**
   - Document props for each component (TypeScript types + JSDoc)
   - Add usage examples in Storybook (optional) or README
   - Document organization context API
   - Document language switching API
   - **Deliverable**: `docs/components.md` with all components documented

2. **Create Developer Guide**
   - How to add new navigation items
   - How to add new translations
   - How to implement role-based permissions
   - How to customize theme colors
   - **Deliverable**: `docs/developer-guide.md`

3. **UX Polish**
   - Review all animations (smooth, not jarring)
   - Check loading state transitions (no flashing)
   - Verify focus indicators visible but not intrusive
   - Test hover states on all interactive elements
   - Ensure consistent spacing and alignment
   - **Deliverable**: Design review checklist completed

4. **Code Review & Refactoring**
   - Review all code for clean code principles (YAGNI, DRY, SOLID)
   - Refactor duplicated logic into shared utilities
   - Ensure all functions have single responsibility
   - Add TODO comments for future improvements
   - **Deliverable**: Code review checklist completed

5. **Final QA Pass**
   - Test all success criteria (SC-001 to SC-013)
   - Verify all functional requirements (FR-001 to FR-025)
   - Test all edge cases
   - Verify all assumptions are documented
   - **Deliverable**: QA sign-off

**Deliverables**:
- ✅ Component documentation
- ✅ Developer guide for extending features
- ✅ UX polish completed
- ✅ Code review and refactoring complete
- ✅ All success criteria verified

---

## Dependencies & Blockers

### External Dependencies
- **Design Assets**: Logo and brand assets needed (assuming provided or placeholder used)
- **API Endpoints**: Organization list API, organization switch API (mock for now, integrate later)
- **Authentication**: User session and role data (assume provided by separate auth feature)

### Internal Dependencies
- None (this is the foundational feature)

### Potential Blockers
- **shadcn/ui Component Limitations**: Some components may need customization for specific requirements
  - *Mitigation*: Review shadcn/ui docs early, fork components if needed
- **next-intl Routing Complexity**: Locale routing may conflict with dashboard routes
  - *Mitigation*: Test locale middleware early, use Next.js layout groups
- **Performance on Mobile**: Large navigation menu may affect mobile performance
  - *Mitigation*: Lazy load Sheet component, optimize bundle size

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)
- **Target Coverage**: 80%+
- **Focus Areas**: Component rendering, props validation, state management, role-based filtering

### Integration Tests (Jest + React Testing Library)
- **Focus Areas**: Navigation flows, org switching, language switching, theme switching

### E2E Tests (Playwright)
- **Scenarios**: All 6 user stories from spec
- **Browsers**: Chromium, Firefox, WebKit (desktop + mobile viewports)

### Accessibility Tests
- **Automated**: axe DevTools on every page
- **Manual**: Screen reader testing (VoiceOver), keyboard navigation testing

### Performance Tests
- **Tools**: Lighthouse, Chrome DevTools
- **Metrics**: FCP, LCP, CLS, Time to Interactive

---

## Success Metrics

All metrics must meet the success criteria defined in `spec.md`:

- ✅ **SC-001**: Max 2 clicks to any section (verified via navigation audit)
- ✅ **SC-002**: WCAG 2.1 AA contrast (verified via axe DevTools + manual check)
- ✅ **SC-003**: 100% keyboard accessibility (verified via keyboard-only testing)
- ✅ **SC-004**: Layout responds <200ms (verified via Chrome DevTools Performance)
- ✅ **SC-005**: 90% user comprehension (post-launch user testing)
- ✅ **SC-006**: Org switch <2s for 95% (verified via performance monitoring)
- ✅ **SC-007**: Menu animation <300ms (verified via Chrome DevTools)
- ✅ **SC-008**: Screen reader navigation <5 tabs (verified via VoiceOver)
- ✅ **SC-009**: Works on 320px width (verified via responsive testing)
- ✅ **SC-010**: State persistence (verified via localStorage tests)
- ✅ **SC-011**: Language switch <100ms (verified via React profiler)
- ✅ **SC-012**: 100% translation coverage (verified via i18n audit)
- ✅ **SC-013**: Language change within 2 clicks (verified via navigation audit)

---

## Timeline Summary

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | Days 1-2 | Foundation setup (Next.js, shadcn/ui, theming, i18n) |
| Phase 2 | Days 3-4 | Header & organization context |
| Phase 3 | Days 5-7 | Sidebar navigation (responsive, role-based, accessible) |
| Phase 4 | Days 8-9 | Routing & page structure |
| Phase 5 | Day 10 | Error handling & logging |
| Phase 6 | Days 11-12 | Testing & accessibility audit |
| Phase 7 | Day 13 | Documentation & refinement |

**Total Estimated Duration**: 13 working days (2.5 weeks)

---

## Next Steps

1. Review and approve this implementation plan
2. Run `/speckit.tasks` to generate detailed task breakdown with TDD approach
3. Create feature branch: `git checkout -b 001-dashboard-shell`
4. Begin Phase 1: Foundation Setup

---

## Notes

- **TDD Approach**: All phases follow Red-Green-Refactor cycle (write test → fail → implement → pass → refactor)
- **Component-First**: All UI elements built as reusable components in `components/` directory
- **Accessibility**: WCAG 2.1 AA compliance verified at every phase, not just at the end
- **Progressive Disclosure**: Complex features (org switching, role filtering) hidden until needed
- **Mobile-First**: Design and test mobile layout first, then enhance for larger screens
- **Constitution Compliance**: All work follows the 6 core principles defined in constitution.md
