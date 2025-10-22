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

## Technology Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: React hooks + Context API
- **Testing**: Jest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, TypeScript strict

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
pnpm test -- --watch

# Run E2E tests
pnpm test:e2e

# Generate coverage report
pnpm test -- --coverage
```

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
