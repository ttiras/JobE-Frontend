<!--
Sync Impact Report:
- Version: 1.0.0 → 1.0.1
- Change Type: PATCH (Clarification of tooling choices)
- Principles Modified: None (Technology Stack Constraints section updated)
- Changes:
  * Specified pnpm as the package manager (was "npm or pnpm")
  * Specified Vercel as deployment platform with explicit features
- Templates Status:
  ✅ plan-template.md - Compatible (no updates required)
  ✅ spec-template.md - Compatible (no updates required)
  ✅ tasks-template.md - Compatible (no updates required)
- Follow-up TODOs: Update README.md and SETUP.md to reference pnpm instead of npm
-->

# JobE Frontend Constitution

## Core Principles

### I. Component-First Architecture

Every feature MUST be built with reusable components as the foundation.

**Rules**:
- Components MUST be self-contained with clear, single responsibility
- Components MUST be independently testable without external dependencies
- Components MUST expose a clear, documented interface (props/API)
- Components MUST follow composition over configuration pattern
- Component variants MUST be created only when justified by distinct use cases
- NO organizational-only components (e.g., no "utils" or "shared" without specific purpose)

**Rationale**: Reusable components reduce duplication, improve maintainability, enable faster
feature development, and ensure consistent UX across the application. This aligns with the
project requirement for "reusable components everywhere."

### II. Test-Driven Development (NON-NEGOTIABLE)

TDD is mandatory for all production code. No exceptions.

**Rules**:
- Tests MUST be written before implementation
- Tests MUST fail before implementation begins
- Implementation proceeds ONLY after test approval
- Red-Green-Refactor cycle MUST be strictly followed
- Code without tests MUST NOT be merged to develop or main branches

**Rationale**: TDD ensures code correctness, prevents regressions, serves as living documentation,
and aligns with the project's "test driven development" principle. This is non-negotiable to
maintain code quality in a business-critical HR application handling sensitive organizational data.

### III. Clean Code & Simplicity (YAGNI)

Write simple, readable code. You Ain't Gonna Need It.

**Rules**:
- Code MUST be self-documenting with clear variable and function names
- Functions MUST do one thing and do it well (Single Responsibility)
- Complexity MUST be justified in writing before introduction
- Abstraction layers MUST solve an existing problem, not anticipated ones
- NO premature optimization
- NO speculative features
- Dependencies MUST be minimal and justified (minimal dependencies principle)

**Rationale**: Simple code is easier to understand, test, modify, and debug. This reduces
onboarding time, maintenance burden, and potential bugs. Aligns with "Clean code, simple ux
and minimal dependencies" project principle.

### IV. Progressive Disclosure UX

UI complexity MUST be revealed progressively based on user needs and expertise.

**Rules**:
- Core workflows MUST be accessible within 3 clicks
- Advanced features MUST be discoverable but not intrusive
- Onboarding flow MUST guide users through essential tasks first
- Complex operations (e.g., questionnaires) MUST be broken into manageable steps
- Help and contextual guidance MUST be available inline
- Mobile-first responsive design MUST ensure clarity on all screen sizes

**Rationale**: HR professionals need efficient access to core features (org management, position
evaluation) without being overwhelmed. Progressive disclosure ensures the UI remains clean and
professional while supporting advanced capabilities like Mercer/Korn Ferry comparisons.

### V. Accessibility as Standard

Accessibility is NOT optional. WCAG 2.1 AA compliance is the minimum standard.

**Rules**:
- All interactive elements MUST be keyboard navigable
- All content MUST have proper semantic HTML
- Color MUST NOT be the only means of conveying information
- All images and icons MUST have meaningful alt text
- Form inputs MUST have proper labels and error messages
- Focus indicators MUST be visible and clear
- Screen reader testing MUST be performed for critical workflows

**Rationale**: HR applications serve diverse users. Accessibility ensures legal compliance,
expands user base, improves usability for all users, and reflects professional quality standards.
This is a stated requirement in the project brief.

### VI. Branch Strategy & Deployment Discipline

Code flows through controlled branches to ensure quality and stability.

**Rules**:
- `develop` branch for staging environment
- `main` branch for production environment
- Feature branches MUST be created from `develop`
- Feature branches MUST follow naming: `###-feature-name`
- PRs MUST pass all tests before merging to `develop`
- Merges to `main` require approval and successful staging validation
- NO direct commits to `develop` or `main`
- Breaking changes MUST be documented and communicated before merge

**Rationale**: Clear branch strategy prevents production incidents, enables safe iteration,
facilitates parallel development, and ensures staging environment accurately reflects upcoming
production changes. Critical for multi-tenant HR application handling sensitive data.

## Technology Stack Constraints

**Framework**: Next.js (latest stable) with TypeScript (strict mode enabled)

**Styling**: Tailwind CSS for utility-first styling, NO CSS-in-JS libraries

**State Management**: React hooks and Context API first; external libraries only if justified

**Data Fetching**: Next.js built-in solutions (App Router patterns) preferred

**Testing**: Jest + React Testing Library for unit/integration, Playwright for E2E

**Code Quality**: ESLint + Prettier (enforced in CI/CD), TypeScript strict mode

**Package Manager**: pnpm (fast, efficient, disk-space optimized)

**Build**: Next.js production build with optimizations enabled

**Deployment**: Vercel (with preview deployments for PRs and automatic deployments from develop/main)

**Rationale**: These constraints align with project requirements ("Next.js with typescript and
tailwind"), ensure consistency, leverage ecosystem best practices, and minimize complexity
through standardization.

## Development Workflow

**Feature Development**:
1. Specification created in `/specs/###-feature-name/spec.md` using `/speckit.specify`
2. Implementation plan created using `/speckit.plan`
3. Tasks generated using `/speckit.tasks`
4. Feature branch created from `develop`
5. TDD cycle for each task (test → fail → implement → pass → refactor)
6. PR created with tests passing and spec verification
7. Code review focusing on constitution compliance
8. Merge to `develop` after approval
9. Staging validation
10. Merge to `main` for production deployment

**Code Review Requirements**:
- ALL constitution principles verified
- Test coverage maintained or improved
- Accessibility tested (keyboard navigation minimum)
- Performance implications considered
- Mobile responsive design verified
- Documentation updated if needed

**Quality Gates**:
- TypeScript compilation with zero errors
- All tests passing (unit, integration, E2E)
- ESLint and Prettier checks passing
- No console.log or debugging code in production
- Bundle size within acceptable limits (document baselines)

## Governance

This constitution supersedes all other development practices and guidelines.

**Amendment Process**:
1. Proposal documented with rationale and impact analysis
2. Team review and discussion period (minimum 48 hours)
3. Approval by project lead required
4. Version incremented per semantic versioning:
   - MAJOR: Backward incompatible principle changes or removals
   - MINOR: New principles added or significant expansions
   - PATCH: Clarifications, wording improvements, non-semantic changes
5. Migration plan created if existing code affected
6. All dependent templates and documentation updated
7. Constitution re-ratified with new version

**Compliance**:
- All PRs MUST verify compliance with this constitution
- Deviations MUST be explicitly justified in PR description
- Constitution violations found in review MUST be corrected before merge
- Complexity introduced MUST be documented in plan.md Complexity Tracking section

**Runtime Guidance**:
For day-to-day development guidance and best practices, refer to feature-specific plan.md files
generated via `/speckit.plan`. These plans inherit constraints from this constitution and provide
context-specific technical decisions.

**Version**: 1.0.1 | **Ratified**: 2025-10-22 | **Last Amended**: 2025-10-22
