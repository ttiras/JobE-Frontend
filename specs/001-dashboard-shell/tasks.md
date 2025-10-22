# Implementation Tasks: Dashboard Shell & Navigation

**Feature Branch**: `001-dashboard-shell`  
**Created**: 2025-10-22  
**Status**: Ready for Implementation  
**Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, next-themes, next-intl

---

## Overview

This document breaks down the Dashboard Shell feature into actionable tasks organized by user story. Each user story can be implemented and tested independently after foundational setup is complete.

**Total Tasks**: 251  
**Parallelizable Tasks**: 50  
**Estimated Duration**: 13 working days (2.5 weeks)

**URL Structure Note**: Default language (English) is omitted from URLs. English routes use `/dashboard`, Turkish routes use `/tr/dashboard`.

---

## Task Format Legend

- `[P]` = Parallelizable (can be worked on simultaneously with other [P] tasks in same phase)
- `[US#]` = User Story number (from spec.md)
- All file paths are relative to project root

---

## Phase 1: Foundation Setup (Days 1-2)

**Objective**: Initialize Next.js project with TypeScript, Tailwind CSS, shadcn/ui, theming, and internationalization.

**Blocking**: Must complete before all other phases.

### Tasks

- [x] T001 Verify pnpm version ≥8.0.0 installed using `pnpm --version`
- [x] T002 Initialize Next.js 14 project with TypeScript and App Router using `pnpm create next-app@latest`
- [x] T003 Configure `tsconfig.json` with strict mode enabled
- [x] T004 Create project directory structure: `app/`, `components/`, `lib/`, `hooks/`, `config/`, `messages/`
- [x] T005 Install shadcn/ui CLI and initialize with default theme (slate colors) using `pnpm dlx shadcn@latest init`
- [x] T006 Install shadcn/ui components: Sheet, DropdownMenu, Button, Separator, Skeleton, Avatar, Badge, Tooltip, ScrollArea
- [x] T007 Configure `components.json` for shadcn/ui default settings
- [x] T008 Install `next-themes` package for light/dark mode support
- [x] T009 Create theme provider in `components/providers/theme-provider.tsx`
- [x] T010 Configure Tailwind CSS for dark mode with `class` strategy in `tailwind.config.ts`
- [x] T011 Install `next-intl` package for internationalization
- [x] T012 Create English translation file `messages/en.json` with placeholder keys for navigation
- [x] T013 Create Turkish translation file `messages/tr.json` with placeholder keys for navigation
- [x] T014 Create locale routing structure `app/[locale]/layout.tsx` with optional locale parameter
- [x] T015 Configure next-intl middleware in `middleware.ts` to omit default locale (en) from URLs and exclude /api, /_next, /static paths from matcher
- [x] T016 Configure middleware to redirect `/en/*` to `/*` (default English without locale prefix)
- [x] T017 Create base dashboard layout structure in `app/[locale]/(dashboard)/layout.tsx`
- [x] T018 Add metadata configuration (title, description, viewport) to root layout
- [x] T019 Verify dev server runs with `pnpm dev` and TypeScript compiles without errors
- [x] T020 Verify TypeScript strict mode compilation with zero errors
- [x] T021 Test default locale: navigate to `/` and `/dashboard` loads in English (no `/en/` prefix)
- [x] T022 Test Turkish locale: navigate to `/tr/dashboard` loads in Turkish

**Deliverables**:
- ✅ Next.js project with TypeScript strict mode
- ✅ shadcn/ui configured with 9 components installed
- ✅ Theme provider with light/dark mode support
- ✅ next-intl configured with EN/TR locales (default locale omitted from URLs)
- ✅ Base layout structure for dashboard

---

## Phase 2: Foundational Components (Days 2-3)

**Objective**: Build shared infrastructure components needed by multiple user stories.

**Blocking**: Must complete before user story phases.

### Tasks

- [x] T023 Create organization context provider in `lib/contexts/organization-context.tsx`
- [x] T024 Define Organization type interface in `lib/types/organization.ts`
- [x] T025 Define User type interface with role field in `lib/types/user.ts`
- [x] T026 Implement localStorage helper for organization persistence in `lib/utils/storage.ts`
- [x] T027 Create error logger utility in `lib/utils/error-logger.ts` with unique error ID generation
- [x] T028 Install `sonner` package for toast notifications
- [x] T029 Create toaster wrapper component in `components/ui/toaster.tsx`
- [x] T030 Add error message translations to `messages/en.json` (orgSwitchFailed, navigationFailed, translationLoadFailed, permissionDenied)
- [x] T031 Add error message translations to `messages/tr.json`
- [x] T032 Create API client utility in `lib/utils/api-client.ts` with retry logic and error handling
- [x] T033 Create role-based navigation filter utility in `lib/utils/navigation-filter.ts`
- [x] T034 Define navigation configuration in `config/navigation.ts` with items, icons, routes, and role permissions
- [x] T035 [P] Verify TypeScript strict mode compilation with zero errors for Phase 2

**Deliverables**:
- ✅ Organization context with persistence
- ✅ Type definitions for core entities
- ✅ Error logging and toast infrastructure
- ✅ API client with retry logic
- ✅ Role-based access control utilities
- ✅ Navigation configuration

---

## Phase 3: User Story 1 - Navigate Between Main Sections (Priority P1) (Days 3-5)

**User Story**: An HR professional logs into JobE and needs to access different areas of the application (organizations, positions, questionnaires, analytics, settings). They should be able to navigate quickly between these sections using clear, accessible navigation.

**Independent Test**: User can click through all navigation items. Each item highlights when active. Success = reach any section within 2 clicks.

### Tasks

- [ ] T036 [P] [US1] Write unit test for Sidebar component: renders nav items, handles active states, emits click events
- [ ] T037 [P] [US1] Create Sidebar component in `components/layout/sidebar.tsx` (256px width on desktop)
- [ ] T038 [P] [US1] Write unit test for NavItem component: renders icon and label, handles click, shows active state
- [ ] T039 [P] [US1] Create NavItem component in `components/layout/nav-item.tsx`
- [ ] T039 [US1] Import Lucide icons for navigation items: Home, Building2, Briefcase, ClipboardList, BarChart3, Settings
- [ ] T040 [US1] Implement navigation items rendering in Sidebar using config from `config/navigation.ts`
- [ ] T041 [US1] Add active state highlighting logic using Next.js `usePathname` hook
- [ ] T042 [US1] Style active navigation item with background color and left border indicator
- [ ] T043 [US1] Add hover states to all navigation items
- [ ] T044 [US1] Create dashboard home page at `app/[locale]/(dashboard)/page.tsx`
- [ ] T045 [P] [US1] Create organizations page at `app/[locale]/(dashboard)/organizations/page.tsx`
- [ ] T046 [P] [US1] Create positions page at `app/[locale]/(dashboard)/positions/page.tsx`
- [ ] T047 [P] [US1] Create questionnaire page at `app/[locale]/(dashboard)/questionnaire/page.tsx`
- [ ] T048 [P] [US1] Create analytics page at `app/[locale]/(dashboard)/analytics/page.tsx`
- [ ] T049 [P] [US1] Create settings page at `app/[locale]/(dashboard)/settings/page.tsx`
- [ ] T050 [US1] Add placeholder content to all 6 pages with page titles
- [ ] T051 [US1] Implement page metadata using `generateMetadata` for each route
- [ ] T052 [US1] Implement scroll position restoration using Next.js built-in scroll restoration for navigation between pages
- [ ] T053 [P] [US1] Write unit test for Header component: renders logo, positions correctly, logo links to home
- [ ] T054 [US1] Create Header component in `components/layout/header.tsx` with sticky positioning
- [ ] T055 [US1] Add logo/wordmark to Header with link to dashboard home
- [ ] T056 [US1] Integrate Sidebar and Header into dashboard layout
- [ ] T057 [US1] Style layout with Tailwind CSS ensuring no content overlap with Sidebar/Header
- [ ] T058 [US1] Add navigation translations to `messages/en.json` (dashboard, organizations, positions, questionnaire, analytics, settings)
- [ ] T059 [US1] Add navigation translations to `messages/tr.json`
- [ ] T060 [P] Verify TypeScript strict mode compilation with zero errors for Phase 3
- [ ] T061 [US1] Test navigation flow: click each nav item and verify route changes and active state updates
- [ ] T062 [US1] Verify logo click returns user to dashboard home from any page

**Deliverables**:
- ✅ Sidebar with 6 navigation items
- ✅ Active state highlighting
- ✅ 6 dashboard pages with routing
- ✅ Header with logo and home link
- ✅ Navigation labels translated (EN/TR)

---

## Phase 4: User Story 2 - Responsive Layout Across Devices (Priority P1) (Days 5-6)

**User Story**: An HR professional accesses JobE from desktop, laptop, and tablet. The dashboard should adapt to each screen size while maintaining full functionality.

**Independent Test**: Resize browser window or access from different devices. Navigation remains accessible, content reflows, no functionality lost.

### Tasks

- [ ] T061 [US2] Write unit test for responsive Sidebar behavior: verifies correct width at each breakpoint
- [ ] T062 [US2] Add responsive breakpoint logic to Sidebar component (desktop: ≥1024px, tablet: 768-1024px, mobile: <768px)
- [ ] T063 [US2] Implement desktop sidebar: always visible, 256px width
- [ ] T064 [US2] Implement tablet sidebar: collapsed to 64px width (icon-only), expand on hover
- [ ] T065 [US2] Add Tooltip component to collapsed sidebar items showing labels on hover
- [ ] T066 [US2] Implement mobile sidebar: hidden by default, opens as Sheet overlay
- [ ] T067 [US2] Create hamburger menu button in Header (visible only on mobile <768px)
- [ ] T068 [US2] Add Sheet component for mobile navigation overlay
- [ ] T069 [US2] Implement Sheet open/close logic with state management
- [ ] T070 [US2] Add click-outside to close Sheet on mobile
- [ ] T071 [US2] Add Escape key handler to close Sheet on mobile
- [ ] T072 [US2] Add close button (X icon) inside mobile Sheet
- [ ] T073 [US2] Implement smooth animations for sidebar transitions (width changes, Sheet slide-in)
- [ ] T074 [US2] Add collapse/expand toggle button to desktop sidebar
- [ ] T075 [US2] Persist sidebar collapsed state in localStorage (`jobe_sidebar_collapsed`)
- [ ] T076 [US2] Adjust main content width when sidebar collapses/expands
- [ ] T077 [US2] Verify TypeScript strict mode compilation with zero errors for Phase 4
- [ ] T078 [US2] Test responsive behavior at all breakpoints: 320px, 768px, 1024px, 1920px
- [ ] T079 [US2] Verify no horizontal scrolling on any viewport size
- [ ] T080 [US2] Test orientation change on tablet (portrait to landscape) maintains state

**Deliverables**:
- ✅ Responsive sidebar (full/icon/overlay)
- ✅ Hamburger menu for mobile
- ✅ Sheet overlay for mobile navigation
- ✅ Collapse/expand functionality with persistence
- ✅ Smooth animations for all transitions

---

## Phase 5: User Story 6 - Keyboard Navigation and Accessibility (Priority P1) (Days 6-7)

**User Story**: An HR professional with motor impairments or who prefers keyboard navigation should access all features using only keyboard. Screen reader users should understand structure and navigate efficiently.

**Independent Test**: Test using only keyboard (Tab, Enter, Space, Escape, Arrow keys) and screen reader. All interactive elements reachable and operable without mouse.

### Tasks

- [ ] T081 [P] [US6] Write unit test for keyboard navigation: Tab navigation, Enter/Space activation, Arrow key support, Escape handler
- [ ] T082 [US6] Add keyboard focus management to navigation items (Tab, Shift+Tab)
- [ ] T083 [US6] Implement visible focus indicators on all interactive elements
- [ ] T084 [US6] Add Enter/Space key handlers to activate focused navigation items
- [ ] T085 [US6] Implement Arrow key navigation (up/down) through sidebar items
- [ ] T086 [US6] Add focus trap to mobile Sheet when open
- [ ] T087 [US6] Implement Escape key handler to close mobile Sheet
- [ ] T088 [US6] Return focus to hamburger button when Sheet closes
- [ ] T089 [US6] Add ARIA label to Sidebar: `<nav aria-label="Main navigation">`
- [ ] T090 [US6] Add ARIA label to mobile Sheet: `aria-label="Mobile navigation menu"`
- [ ] T091 [US6] Add aria-current="page" to active navigation item
- [ ] T092 [US6] Add aria-hidden="true" to navigation icons (labels handle accessibility)
- [ ] T093 [US6] Add skip-to-content link for keyboard users
- [ ] T094 [P] Verify TypeScript strict mode compilation with zero errors for Phase 5
- [ ] T095 [US6] Test keyboard navigation flow: Tab through all elements in logical order
- [ ] T096 [US6] Test with screen reader (VoiceOver): verify landmarks announced correctly
- [ ] T097 [US6] Run axe DevTools accessibility audit on all pages
- [ ] T098 [US6] Verify WCAG 2.1 AA color contrast (4.5:1 for text, 3:1 for UI components)
- [ ] T099 [US6] Fix any accessibility violations found in audit

**Deliverables**:
- ✅ Full keyboard navigation support
- ✅ Visible focus indicators
- ✅ ARIA labels and landmarks
- ✅ Focus trap in mobile menu
- ✅ WCAG 2.1 AA compliance verified

---

## Phase 6: User Story 4 - Language Switching (Priority P1) (Days 7-8)

**User Story**: An HR professional who prefers Turkish or English needs to switch the application language. The entire interface should update to selected language. Preference persists across sessions.

**Independent Test**: Switch between English and Turkish. All UI text updates correctly. Preference persists after browser refresh.

### Tasks

- [ ] T100 [P] [US4] Write unit test for LanguageSwitcher component: renders both options, switches locale on click, updates URL
- [ ] T101 [P] [US4] Create LanguageSwitcher component in `components/layout/language-switcher.tsx` using DropdownMenu
- [ ] T102 [P] [US4] Add language options: English (with flag emoji 🇬🇧), Türkçe (with flag emoji 🇹🇷)
- [ ] T103 [US4] Integrate LanguageSwitcher into Header component (right side)
- [ ] T104 [US4] Implement locale switching logic using next-intl `useRouter` and `usePathname`
- [ ] T105 [US4] Update URL when language changes: English → `/dashboard` (no locale prefix), Turkish → `/tr/dashboard`
- [ ] T106 [US4] Verify all navigation labels update immediately when language switches
- [ ] T107 [US4] Add complete translations for all UI text in `messages/en.json`
- [ ] T108 [US4] Add complete translations for all UI text in `messages/tr.json`
- [ ] T109 [P] Verify TypeScript strict mode compilation with zero errors for Phase 6
- [ ] T110 [US4] Test language persistence: switch to Turkish, refresh browser, verify UI remains in Turkish
- [ ] T111 [US4] Test language switching on all 6 pages: verify text updates across entire interface
- [ ] T112 [US4] Add language switcher to mobile navigation menu
- [ ] T113 [US4] Verify user-generated content (org names, etc.) remains unchanged when language switches
- [ ] T114 [US4] Test fallback behavior: remove a translation key, verify fallback to English
- [ ] T115 [US4] Test default locale behavior: verify `/dashboard` loads in English without `/en/` prefix

**Deliverables**:
- ✅ Language switcher in header
- ✅ English/Turkish translations complete
- ✅ Immediate UI updates on language change
- ✅ Language preference persists
- ✅ Accessible in mobile menu

---

## Phase 7: User Story 3 - Organization Switching (Priority P2) (Days 8-9)

**User Story**: An HR consultant managing multiple client organizations needs to switch between different organizations' data. They should select an organization from dropdown in header and have all content update.

**Independent Test**: Create multiple test organizations. Switch between them and verify context updates. All subsequent navigation shows data for selected organization.

### Tasks

- [ ] T116 [P] [US3] Write unit test for OrgSelector component: renders current org, shows list, handles selection, search >10 orgs
- [ ] T117 [P] [US3] Create OrgSelector component in `components/layout/org-selector.tsx` using DropdownMenu
- [ ] T118 [P] [US3] Display current organization name in header with dropdown arrow
- [ ] T119 [US3] Render list of accessible organizations in dropdown
- [ ] T120 [US3] Add search input to OrgSelector for filtering (shown when >10 orgs)
- [ ] T121 [US3] Implement search/filter logic for organization list
- [ ] T122 [US3] Handle single-org case: show org name without dropdown (not clickable)
- [ ] T123 [US3] Integrate OrgSelector into Header component
- [ ] T124 [US3] Implement optimistic UI update: header updates immediately on org selection
- [ ] T125 [US3] Add Skeleton loading state to main content area during org switch
- [ ] T126 [US3] Update organization context when org is selected
- [ ] T127 [US3] Persist selected organization in localStorage
- [ ] T128 [US3] Create mock API endpoint for organization list in `app/api/organizations/route.ts`
- [ ] T129 [US3] Create mock API endpoint for organization switch in `app/api/organizations/[id]/route.ts`
- [ ] T130 [US3] Implement background sync: call API to fetch org-specific data after optimistic update
- [ ] T131 [US3] Add error handling for org switch failures (network error, unauthorized, etc.)
- [ ] T132 [US3] Show error toast with unique error ID when org switch fails
- [ ] T133 [US3] Revert to previous organization context if switch fails
- [ ] T134 [US3] Add keyboard navigation to OrgSelector dropdown (arrow keys, Enter to select)
- [ ] T135 [P] Verify TypeScript strict mode compilation with zero errors for Phase 7
- [ ] T136 [US3] Test org switching: select org → header updates immediately → loading state → data updates
- [ ] T137 [US3] Verify org context persists across page navigation
- [ ] T138 [US3] Test org context persists across browser refresh

**Deliverables**:
- ✅ Organization selector in header
- ✅ Optimistic UI with background sync
- ✅ Loading states during org switch
- ✅ Search/filter for >10 organizations
- ✅ Error handling with toast notifications
- ✅ Context persistence

---

## Phase 8: User Story 5 - Visual Hierarchy and Wayfinding (Priority P2) (Days 9-10)

**User Story**: An HR professional using JobE for the first time should immediately understand where they are, what sections are available, and how to navigate. Interface provides clear visual cues about current location.

**Independent Test**: User observation and navigation audit. Users can identify current location, understand what each section does, find target pages within 3 clicks.

### Tasks

- [ ] T139 [P] [US5] Write unit test for Breadcrumb component: renders segments, clickable navigation, current segment not clickable
- [ ] T140 [P] [US5] Create Breadcrumb component in `components/layout/breadcrumb.tsx`
- [ ] T141 [US5] Implement breadcrumb generation logic based on current route
- [ ] T142 [US5] Format breadcrumbs: Home > Organizations > [Org Name]
- [ ] T143 [US5] Make each breadcrumb segment clickable except last segment
- [ ] T144 [US5] Style breadcrumbs with separators (chevron or slash)
- [ ] T145 [US5] Integrate Breadcrumb into nested pages: organizations/[id], positions/[id]
- [ ] T146 [US5] Add page titles to all pages in `messages/en.json`
- [ ] T147 [US5] Add page titles to all pages in `messages/tr.json`
- [ ] T148 [US5] Display page title prominently in page header
- [ ] T149 [US5] Enhance navigation icons for better recognition
- [ ] T150 [US5] Add subtle animation to active navigation item (slide-in indicator)
- [ ] T151 [P] Verify TypeScript strict mode compilation with zero errors for Phase 8
- [ ] T152 [US5] Test visual hierarchy: verify current section is immediately obvious
- [ ] T153 [US5] Test breadcrumbs on nested pages: click each segment and verify navigation
- [ ] T154 [US5] Verify all navigation items have recognizable icons matching industry conventions

**Deliverables**:
- ✅ Breadcrumb navigation component
- ✅ Page titles on all pages
- ✅ Enhanced visual indicators for current location
- ✅ Recognizable navigation icons
- ✅ Clear information architecture

---

## Phase 9: Theme Support (Light/Dark Mode) (Day 10)

**Objective**: Implement light/dark mode toggle with persistence. This enhances all user stories.

### Tasks

- [ ] T155 [P] Write unit test for ThemeToggle component: renders icon, switches theme on click, persists selection
- [ ] T156 [P] Create ThemeToggle component in `components/layout/theme-toggle.tsx` using Sun/Moon icons
- [ ] T157 [P] Add theme toggle to Header component (right side, near language switcher)
- [ ] T158 Implement theme switching logic using next-themes `useTheme` hook
- [ ] T159 Add theme persistence check in ThemeProvider
- [ ] T160 Verify all shadcn/ui components render correctly in dark mode
- [ ] T161 Test custom components (Sidebar, Header, NavItem) in dark mode
- [ ] T162 Adjust colors in dark mode if needed for WCAG AA contrast
- [ ] T163 Add theme toggle to mobile navigation menu
- [ ] T164 [P] Verify TypeScript strict mode compilation with zero errors for Phase 9
- [ ] T165 Test theme persistence: switch to dark mode, refresh browser, verify mode persists
- [ ] T166 Verify theme toggle is keyboard accessible

**Deliverables**:
- ✅ Theme toggle in header
- ✅ Light/dark mode support
- ✅ Theme persistence
- ✅ All components work in both modes
- ✅ WCAG AA contrast in dark mode

---

## Phase 10: Role-Based Access Control (Day 10)

**Objective**: Filter navigation and routes based on user role. Supports User Stories 1 and 5.

### Tasks

- [ ] T167 [P] Write unit test for UserMenu component: renders user info, role badge, menu items
- [ ] T168 [P] Create UserMenu component in `components/layout/user-menu.tsx` using DropdownMenu
- [ ] T169 [P] Display user avatar and name in UserMenu
- [ ] T170 Add user menu items: Profile, Settings, Logout
- [ ] T171 Add role badge to UserMenu (Admin, HR Manager, Viewer)
- [ ] T172 Integrate UserMenu into Header component
- [ ] T173 Implement role-based navigation filtering in Sidebar component
- [ ] T174 Filter navigation items based on user role from organization context
- [ ] T175 Create route protection middleware in `middleware.ts`
- [ ] T176 Redirect unauthorized users attempting direct URL access to dashboard home
- [ ] T177 Show permission denied error toast with unique error ID
- [ ] T178 Log unauthorized access attempts with error logger
- [ ] T179 [P] Verify TypeScript strict mode compilation with zero errors for Phase 10
- [ ] T180 Test Admin role: verify all 6 nav items visible (Dashboard, Organizations, Positions, Questionnaire, Analytics, Settings)
- [ ] T181 Test HR Manager role: verify 5 nav items visible (no Settings)
- [ ] T182 Test Viewer role: verify 4 nav items visible (no Questionnaire, no Settings)
- [ ] T183 Test direct URL access: attempt to access /settings as Viewer, verify redirect and error message

**Deliverables**:
- ✅ User menu with role badge
- ✅ Role-based navigation filtering
- ✅ Route protection middleware
- ✅ Error handling for unauthorized access
- ✅ Error logging with unique IDs

---

## Phase 11: Error Handling & Logging (Day 11)

**Objective**: Comprehensive error handling with user-friendly messages and logging. Supports all user stories.

### Tasks

- [ ] T161 Create error boundary in `app/[locale]/(dashboard)/error.tsx`
- [ ] T162 Display user-friendly error message with unique error ID in error boundary
- [ ] T163 Add "Try Again" button to error boundary to reset error state
- [ ] T164 Log error details to console in error logger utility
- [ ] T165 Add error message for org switch failure to translations (EN/TR)
- [ ] T166 Add error message for navigation failure to translations (EN/TR)
- [ ] T167 Add error message for translation load failure to translations (EN/TR)
- [ ] T168 Add error message for permission denied to translations (EN/TR)
- [ ] T169 Implement error toast with error ID when critical operations fail
- [ ] T170 Add offline indicator when network is unavailable
- [ ] T171 Test error boundary: throw error in component, verify error UI shows with error ID
- [ ] T172 Test error toast: trigger org switch failure, verify toast appears with message and error ID
- [ ] T173 Test API retry logic: simulate network failure, verify 3 retry attempts with exponential backoff
- [ ] T174 Verify error messages translated correctly in both English and Turkish
- [ ] T175 Test toast auto-dismiss after 5 seconds
- [ ] T176 [P] Verify TypeScript strict mode compilation with zero errors for Phase 11

**Deliverables**:
- ✅ Error boundary with unique error IDs
- ✅ Toast notifications for errors
- ✅ Translated error messages (EN/TR)
- ✅ Offline indicator
- ✅ Retry logic for network failures

---

## Phase 12: Loading States (Day 11)

**Objective**: Add loading states to all pages and async operations. Enhances perceived performance.

### Tasks

- [ ] T177 [P] Write unit test for loading.tsx components: render Skeleton with correct layout
- [ ] T178 [P] Create loading.tsx for dashboard home at `app/[locale]/(dashboard)/loading.tsx`
- [ ] T179 [P] Create loading.tsx for organizations at `app/[locale]/(dashboard)/organizations/loading.tsx`
- [ ] T180 [P] Create loading.tsx for positions at `app/[locale]/(dashboard)/positions/loading.tsx`
- [ ] T181 [P] Create loading.tsx for questionnaire at `app/[locale]/(dashboard)/questionnaire/loading.tsx`
- [ ] T182 [P] Create loading.tsx for analytics at `app/[locale]/(dashboard)/analytics/loading.tsx`
- [ ] T183 [P] Create loading.tsx for settings at `app/[locale]/(dashboard)/settings/loading.tsx`
- [ ] T184 Use Skeleton component in all loading.tsx files
- [ ] T185 Match Skeleton layout to expected page content
- [ ] T186 [P] Verify TypeScript strict mode compilation with zero errors for Phase 12
- [ ] T187 Test loading states: navigate between pages, verify Skeleton shows briefly
- [ ] T188 Test org switching loading: verify Skeleton appears in main content during switch

**Deliverables**:
- ✅ Loading states for all 6 pages
- ✅ Skeleton components matching layouts
- ✅ Smooth loading transitions

---

## Phase 13: Testing & Quality Assurance (Days 12-13)

**Objective**: Write comprehensive tests and ensure quality across all user stories.

### Tasks

- [ ] T189 [P] Write unit test for Header component: renders logo, org selector, user menu, language toggle, theme toggle
- [ ] T190 [P] Write unit test for Sidebar component: renders nav items, highlights active item
- [ ] T191 [P] Write unit test for NavItem component: renders with icon and label, handles click
- [ ] T192 [P] Write unit test for OrgSelector component: opens dropdown, updates context on selection
- [ ] T193 [P] Write unit test for LanguageSwitcher component: changes locale, updates URL
- [ ] T194 [P] Write unit test for ThemeToggle component: switches light/dark mode
- [ ] T195 [P] Write unit test for UserMenu component: displays user info, shows role badge
- [ ] T196 [P] Write unit test for Breadcrumb component: generates breadcrumbs, handles clicks
- [ ] T197 [P] Write unit test for navigation filter utility: filters items by role
- [ ] T198 [P] Write unit test for error logger: generates unique error IDs, logs correctly
- [ ] T199 Write integration test for navigation flow: click nav item → route changes → active item updates
- [ ] T200 Write integration test for org switching: select org → context updates → loading state → data updates
- [ ] T201 Write integration test for language switching: select language → all UI text updates → URL changes
- [ ] T202 Write integration test for theme switching: toggle theme → colors update → preference persists
- [ ] T203 Write integration test for role-based filtering: change role → nav items update
- [ ] T204 Write E2E test for User Story 1: navigate between all 6 sections
- [ ] T205 Write E2E test for User Story 2: test responsive behavior on desktop, tablet, mobile
- [ ] T206 Write E2E test for User Story 3: switch organizations and verify context persists
- [ ] T207 Write E2E test for User Story 4: switch language and verify UI updates
- [ ] T208 Write E2E test for User Story 5: verify breadcrumbs and visual hierarchy
- [ ] T209 Write E2E test for User Story 6: keyboard navigation through all interactive elements
- [ ] T210 Write E2E test for edge case: session expiration during org switch → redirect to login
- [ ] T211 Write E2E test for edge case: backend unreachable during navigation → error boundary with retry
- [ ] T212 Write E2E test for edge case: user with >10 organizations → search/filter works correctly
- [ ] T213 Run test suite and achieve 80%+ code coverage
- [ ] T214 Run Lighthouse audit on all pages: verify Performance, Accessibility, Best Practices, SEO ≥90
- [ ] T215 Test on desktop resolutions: 1920x1080, 1366x768
- [ ] T216 Test on tablet resolutions: iPad 768x1024, iPad Pro 1024x1366
- [ ] T217 Test on mobile resolutions: iPhone SE 375x667, iPhone 14 390x844, Galaxy S21 360x800
- [ ] T218 Verify no horizontal scrolling on any screen size
- [ ] T219 Test First Contentful Paint (FCP) < 1.8s
- [ ] T220 Test Largest Contentful Paint (LCP) < 2.5s
- [ ] T221 Test Cumulative Layout Shift (CLS) < 0.1
- [ ] T222 Implement and test layout performance measurement: verify 200ms response time for actions
- [ ] T223 Test organization switching completes < 2 seconds (95th percentile)
- [ ] T224 Test menu animation completes < 300ms
- [ ] T225 [P] Verify TypeScript strict mode compilation with zero errors for Phase 13

**Deliverables**:
- ✅ 30+ unit tests with 80%+ coverage
- ✅ 10+ integration tests
- ✅ 6+ E2E tests covering all user stories
- ✅ Lighthouse scores ≥90 on all metrics
- ✅ Responsive design verified on 6+ devices
- ✅ Performance metrics meet success criteria

---

## Phase 14: Documentation & Polish (Day 13)

**Objective**: Document components, create usage examples, and polish UX.

### Tasks

- [ ] T226 [P] Document Header component props and usage in JSDoc
- [ ] T227 [P] Document Sidebar component props and usage in JSDoc
- [ ] T228 [P] Document NavItem component props and usage in JSDoc
- [ ] T229 [P] Document OrgSelector component props and usage in JSDoc
- [ ] T230 [P] Document LanguageSwitcher component props and usage in JSDoc
- [ ] T231 [P] Document ThemeToggle component props and usage in JSDoc
- [ ] T232 [P] Document UserMenu component props and usage in JSDoc
- [ ] T233 [P] Document Breadcrumb component props and usage in JSDoc
- [ ] T234 Create developer guide in `docs/developer-guide.md`
- [ ] T235 Document how to add new navigation items in developer guide
- [ ] T236 Document how to add new translations in developer guide
- [ ] T237 Document how to implement role-based permissions in developer guide
- [ ] T238 Document how to customize theme colors in developer guide
- [ ] T239 Review all animations: verify smooth, not jarring
- [ ] T240 Review loading state transitions: verify no flashing
- [ ] T241 Verify focus indicators visible but not intrusive
- [ ] T242 Test hover states on all interactive elements
- [ ] T243 Ensure consistent spacing and alignment across all components
- [ ] T244 Review code for clean code principles (YAGNI, DRY, SOLID)
- [ ] T245 Refactor duplicated logic into shared utilities
- [ ] T246 Ensure all functions have single responsibility
- [ ] T247 Add TODO comments for future improvements
- [ ] T248 [P] Verify TypeScript strict mode compilation with zero errors for Phase 14
- [ ] T249 Final QA: verify all success criteria (SC-001 to SC-013) from spec.md
- [ ] T250 Final QA: verify all functional requirements (FR-001 to FR-025) from spec.md
- [ ] T251 Final QA: test all edge cases from spec.md

**Deliverables**:
- ✅ All components documented with JSDoc
- ✅ Developer guide complete
- ✅ UX polish completed
- ✅ Code review and refactoring complete
- ✅ All success criteria verified
- ✅ All functional requirements verified

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Foundation Setup)
    ↓
Phase 2 (Foundational Components)
    ↓
    ├─→ Phase 3 (US1: Navigation) ──────────────┐
    ├─→ Phase 4 (US2: Responsive) ──────────────┤
    ├─→ Phase 5 (US6: Accessibility) ───────────┤
    ├─→ Phase 6 (US4: Language Switching) ──────┤
    ├─→ Phase 7 (US3: Org Switching) ───────────┤
    └─→ Phase 8 (US5: Visual Hierarchy) ────────┤
                                                 ↓
        Phase 9 (Theme Support) ─────────────────┤
        Phase 10 (RBAC) ─────────────────────────┤
        Phase 11 (Error Handling) ───────────────┤
        Phase 12 (Loading States) ───────────────┤
                                                 ↓
        Phase 13 (Testing & QA)
                ↓
        Phase 14 (Documentation & Polish)
```

### User Story Independence

After **Phase 2** completes, the following user stories can be implemented **in parallel**:

- **US1** (Navigate Between Main Sections) - Core navigation
- **US2** (Responsive Layout) - Enhances US1 with responsive behavior
- **US4** (Language Switching) - Independent feature
- **US6** (Accessibility) - Enhances US1 with a11y features

**US3** (Organization Switching) depends on US1 being complete.  
**US5** (Visual Hierarchy) depends on US1 being complete.

### Parallel Execution Examples

**Phase 3 (US1) Parallel Tasks**:
- T041 (organizations page), T042 (positions page), T043 (questionnaire page), T044 (analytics page), T045 (settings page) can all be created in parallel

**Phase 6 (US4) Parallel Tasks**:
- T090 (LanguageSwitcher component) and T091 (language options) can be built in parallel

**Phase 9 (Theme) Parallel Tasks**:
- T136 (ThemeToggle component) and T137 (add to Header) can be built in parallel

**Phase 13 (Testing) Parallel Tasks**:
- T186-T195 (unit tests) can all be written in parallel
- T201-T206 (E2E tests) can all be written in parallel

---

## Implementation Strategy

### MVP Scope (First Release)

**Priority P1 User Stories ONLY**:
- ✅ US1: Navigate Between Main Sections
- ✅ US2: Responsive Layout Across Devices
- ✅ US4: Language Switching
- ✅ US6: Keyboard Navigation and Accessibility

**Plus Infrastructure**:
- ✅ Theme Support (light/dark mode)
- ✅ Error Handling & Logging
- ✅ Loading States

**Estimated MVP Duration**: 10 days

### Phase 2 Release (Enhanced Features)

**Priority P2 User Stories**:
- ✅ US3: Organization Switching
- ✅ US5: Visual Hierarchy and Wayfinding
- ✅ RBAC with role-based navigation filtering

**Estimated Phase 2 Duration**: 3 days

### Total Duration: 13 days (2.5 weeks)

---

## Testing Approach

All tasks follow **TDD approach** where applicable:

1. **Write test first** (or acceptance criteria)
2. **Run test** → should fail (Red)
3. **Implement feature** → minimal code to pass
4. **Run test** → should pass (Green)
5. **Refactor** → improve code quality
6. **Run test again** → should still pass

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage for all components and utilities
- **Integration Tests**: All user flows covered
- **E2E Tests**: All 6 user stories covered
- **Accessibility**: WCAG 2.1 AA compliance verified
- **Performance**: All success criteria metrics met

---

## Success Validation

Before marking feature complete, verify:

- [ ] All 245 tasks completed
- [ ] All 6 user stories independently testable
- [ ] All 13 success criteria (SC-001 to SC-013) met
- [ ] All 25 functional requirements (FR-001 to FR-025) implemented
- [ ] All edge cases handled
- [ ] WCAG 2.1 AA compliance verified
- [ ] Test coverage ≥80%
- [ ] Lighthouse scores ≥90
- [ ] Performance metrics met
- [ ] All components documented
- [ ] Developer guide complete
- [ ] Default locale (en) omitted from all URLs

---

## Notes

- All file paths are relative to project root
- Use `pnpm` for all package management
- Follow TypeScript strict mode
- Use shadcn/ui components where possible
- Maintain component-first architecture
- Follow TDD approach for all implementations
- Test accessibility continuously, not just at the end
- Mobile-first responsive design
- Constitution compliance: all 6 core principles
- **URL Structure**: Default language (English) omitted from URLs (`/dashboard`), Turkish uses `/tr/dashboard`

---

**Generated**: 2025-10-22  
**Next Step**: Begin Phase 1, Task T001
