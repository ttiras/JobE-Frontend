# JobE Frontend

A modern job evaluation application for HR professionals to manage organizational structures, evaluate positions, and gain insights into compensation strategies.

## Overview

JobE enables HR professionals to:
- Create and manage multi-tenant organizations
- Import organizational structure via Excel (departments, positions)
- Evaluate positions through intelligent questionnaires (8-15 questions)
- Generate automated job evaluation scores
- Compare results with Mercer and Korn Ferry methodologies
- Access analytics dashboards for position levels and compensation insights

## 🚀 Implementation Status

**Current Progress**: 120/251 tasks (48% complete)

### ✅ Completed Phases
- **Phase 1-2**: Foundation & UI components (35 tasks)
- **Phase 3**: Navigation system with 6 dashboard pages (30 tasks)
- **Phase 4**: Responsive layout (mobile/tablet/desktop) (20 tasks)
- **Phase 5**: Keyboard navigation & accessibility (17 tasks)
- **Phase 6**: Language switching (EN/TR) - Core features (6 tasks)
- **Phase 9**: Theme support (light/dark mode) (12 tasks)

### 🎯 Key Features Implemented
- ✅ Responsive sidebar (collapsible on desktop, overlay on mobile)
- ✅ Full keyboard navigation (Tab, Arrow keys, Enter, Space, Escape)
- ✅ Internationalization (English default, Turkish with /tr prefix)
- ✅ Theme toggle (light/dark with localStorage persistence)
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Skip-to-content link for screen readers
- ✅ 66 test cases covering critical functionality
- ✅ Zero TypeScript errors in strict mode

### 📋 Remaining Phases
- Phase 7: Organization Switching (23 tasks)
- Phase 8: Breadcrumbs/Wayfinding (16 tasks)
- Phase 10: RBAC (18 tasks)
- Phase 11: Error Handling (16 tasks)
- Phase 12: Loading States (12 tasks)
- Phase 13: Testing & QA (40 tasks)
- Phase 14: Documentation (26 tasks)

For detailed implementation report, see [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## Technology Stack

- **Framework**: Next.js 15.5.6 (App Router)
- **Language**: TypeScript 5.9.3 (strict mode)
- **Styling**: Tailwind CSS 3.4.18
- **UI Components**: shadcn/ui (9 components)
- **Internationalization**: next-intl 4.4.0
- **Theme**: next-themes 0.4.6
- **Icons**: lucide-react 0.546.0
- **State Management**: React hooks + Context API
- **Testing**: Jest 30.2.0, React Testing Library 16.3.0, Playwright
- **Code Quality**: ESLint, Prettier, TypeScript strict
- **Package Manager**: pnpm 10.15.0

## Project Principles

This project follows strict principles defined in [`.specify/memory/constitution.md`](./.specify/memory/constitution.md):

1. **Component-First Architecture** - Reusable, self-contained components everywhere
2. **Test-Driven Development** - Tests written before implementation (non-negotiable)
3. **Clean Code & Simplicity** - YAGNI principle, minimal dependencies
4. **Progressive Disclosure UX** - Clean interface, complex features revealed progressively
5. **Accessibility as Standard** - WCAG 2.1 AA minimum compliance
6. **Branch Strategy** - `develop` for staging, `main` for production

## Getting Started

### Prerequisites

- Node.js 18+ (or latest LTS)
- pnpm (recommended package manager)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd JobE-Frontend

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development Workflow

### Creating a New Feature

1. **Specify**: Create feature specification
   ```bash
   # Use the speckit.specify prompt
   ```

2. **Plan**: Generate implementation plan
   ```bash
   # Use the speckit.plan prompt
   ```

3. **Tasks**: Break down into actionable tasks
   ```bash
   # Use the speckit.tasks prompt
   ```

4. **Implement**: Follow TDD cycle
   - Create feature branch from `develop`: `###-feature-name`
   - Write tests first
   - Ensure tests fail
   - Implement feature
   - Ensure tests pass
   - Refactor

5. **Review**: Create PR to `develop`
   - All tests must pass
   - Constitution compliance verified
   - Accessibility tested
   - Mobile responsive design verified

6. **Deploy**: Merge to `main` after staging validation

## Branch Strategy

- `main` - Production branch (protected)
- `develop` - Staging branch (protected)
- `###-feature-name` - Feature branches (created from `develop`)

## Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests (coming in Phase 13)
pnpm test:e2e

# Generate coverage report
pnpm test:coverage
```

### Test Coverage
- **66 test cases** across 7 test suites
- Responsive layout (10 tests)
- Keyboard navigation (15 tests)
- Language switching (14 tests)
- Theme toggle (13 tests)
- Plus additional component tests

## Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

## Project Structure

```
JobE-Frontend/
├── .github/              # GitHub workflows and prompts
│   └── prompts/         # Speckit command prompts
├── .specify/            # Project governance and templates
│   ├── memory/          # Constitution and project memory
│   └── templates/       # Feature specification templates
├── src/                 # Source code
│   ├── app/            # Next.js app router pages
│   ├── components/     # Reusable React components
│   ├── lib/            # Utility functions and helpers
│   └── types/          # TypeScript type definitions
├── specs/              # Feature specifications (generated)
├── tests/              # Test files
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/           # End-to-end tests
└── public/            # Static assets
```

## Key Features

### 1. Organization Management
Multi-tenant architecture supporting multiple organizations with isolated data.

### 2. Excel Import
Streamlined import process for organizational structure:
- Departments
- Positions
- Reporting relationships

### 3. Position Questionnaire
Adaptive questionnaire system (8-15 questions) based on position complexity, evaluating:
- Responsibility level
- Decision-making authority
- Impact on organization
- Required expertise
- Team size and scope

### 4. Job Evaluation Scoring
Automated scoring system with:
- Weighted question responses
- Position level determination
- Internal equity analysis

### 5. Methodology Comparison
Compare results with industry-standard methodologies:
- Mercer job evaluation
- Korn Ferry Hay Guide Chart

### 6. Analytics Dashboard
Comprehensive insights including:
- Position level distribution
- Compensation analysis
- Department comparisons
- Trend analysis

## UI/UX Principles

- **Clean & Professional**: Modern dashboard interface optimized for HR workflows
- **Simple Onboarding**: Excel import wizard with clear guidance
- **Progressive Disclosure**: Advanced features accessible without cluttering interface
- **Mobile-Responsive**: Full functionality across all device sizes
- **Accessible**: WCAG 2.1 AA compliant for inclusive user experience

## Contributing

1. Read the [Constitution](./.specify/memory/constitution.md)
2. Follow the TDD workflow
3. Ensure all tests pass
4. Verify accessibility compliance
5. Submit PR to `develop` branch

## License

[LICENSE TYPE] - See LICENSE file for details

## Support

For questions or issues, please open an issue in the repository.
