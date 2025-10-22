# JobE Frontend Quick Reference

## Constitution at a Glance

### The 6 Non-Negotiables

1. **Component-First** - Every feature built with reusable components
2. **TDD Required** - Tests before code, always
3. **Keep It Simple** - YAGNI, minimal dependencies, clean code
4. **Progressive UX** - Core features in ≤3 clicks, complexity hidden until needed
5. **Accessibility** - WCAG 2.1 AA minimum (not optional)
6. **Branch Discipline** - `develop` → staging, `main` → production

## Feature Development Checklist

### Before You Start
- [ ] Feature spec exists in `/specs/###-feature-name/spec.md`
- [ ] Implementation plan created (`/speckit.plan`)
- [ ] Tasks broken down (`/speckit.tasks`)
- [ ] Feature branch created from `develop`

### During Development (TDD Cycle)
- [ ] Write test first
- [ ] Verify test fails (RED)
- [ ] Write minimal code to pass (GREEN)
- [ ] Refactor while keeping tests green (REFACTOR)
- [ ] Repeat for next requirement

### Before PR
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compiles with zero errors (`npm run type-check`)
- [ ] Code linted and formatted (`npm run lint && npm run format`)
- [ ] Accessibility tested (keyboard navigation minimum)
- [ ] Mobile responsive verified
- [ ] No `console.log` or debug code
- [ ] Documentation updated if needed

### PR Review Focus
- [ ] Constitution compliance verified
- [ ] Test coverage adequate
- [ ] Components are reusable and self-contained
- [ ] Code is simple and readable
- [ ] No premature optimization or complexity
- [ ] Accessibility requirements met
- [ ] Performance considerations addressed

## Common Commands

```bash
# Development
pnpm dev                   # Start dev server
pnpm test -- --watch       # Run tests in watch mode
pnpm lint                  # Check code quality
pnpm format                # Auto-format code

# Quality Checks
pnpm test                  # Run all tests
pnpm test:e2e              # E2E tests
pnpm test -- --coverage    # Coverage report
pnpm type-check            # TypeScript validation

# Branching
git checkout develop       # Switch to develop
git pull origin develop    # Get latest changes
git checkout -b 001-feature-name  # Create feature branch
```

## File Structure Conventions

```
src/
├── app/                   # Next.js pages (App Router)
│   ├── (auth)/           # Auth route group
│   ├── (dashboard)/      # Dashboard route group
│   └── api/              # API routes
├── components/            # Reusable components
│   ├── ui/               # Base UI components (Button, Input, etc.)
│   ├── forms/            # Form components
│   └── layouts/          # Layout components
├── lib/                  # Utilities and helpers
│   ├── utils.ts          # General utilities
│   └── api.ts            # API client
└── types/                # TypeScript definitions

tests/
├── unit/                 # Unit tests (*.test.ts)
├── integration/          # Integration tests
└── e2e/                  # Playwright tests

specs/                    # Feature specifications
└── ###-feature-name/
    ├── spec.md           # Feature spec
    ├── plan.md           # Implementation plan
    ├── tasks.md          # Task breakdown
    └── contracts/        # API contracts
```

## Component Guidelines

### Good Component Example
```typescript
// src/components/forms/PositionInput.tsx

interface PositionInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Input field for position names with validation
 * Accessible with proper labels and error messaging
 */
export function PositionInput({ 
  value, 
  onChange, 
  error, 
  disabled 
}: PositionInputProps) {
  return (
    <div>
      <label htmlFor="position-input" className="block text-sm font-medium">
        Position Name
      </label>
      <input
        id="position-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? "position-error" : undefined}
        className="mt-1 block w-full rounded-md border-gray-300"
      />
      {error && (
        <p id="position-error" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

### What Makes It Good?
- ✅ Single responsibility (position input only)
- ✅ Clear, typed interface
- ✅ Accessible (labels, aria attributes)
- ✅ Error handling
- ✅ Documented purpose
- ✅ No external dependencies
- ✅ Easily testable

## Testing Guidelines

### Unit Test Example
```typescript
// tests/unit/PositionInput.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { PositionInput } from '@/components/forms/PositionInput';

describe('PositionInput', () => {
  it('calls onChange when user types', () => {
    const handleChange = jest.fn();
    render(<PositionInput value="" onChange={handleChange} />);
    
    const input = screen.getByLabelText('Position Name');
    fireEvent.change(input, { target: { value: 'Manager' } });
    
    expect(handleChange).toHaveBeenCalledWith('Manager');
  });

  it('displays error message when provided', () => {
    render(
      <PositionInput 
        value="" 
        onChange={() => {}} 
        error="Position name required" 
      />
    );
    
    expect(screen.getByText('Position name required')).toBeInTheDocument();
  });

  it('is keyboard accessible', () => {
    render(<PositionInput value="" onChange={() => {}} />);
    
    const input = screen.getByLabelText('Position Name');
    input.focus();
    
    expect(input).toHaveFocus();
  });
});
```

## Accessibility Quick Checks

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activates buttons and links
- [ ] Escape closes modals and dropdowns
- [ ] Arrow keys work in custom controls

### Screen Reader
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced

### Visual
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators visible
- [ ] Text resizes without breaking layout
- [ ] Content works without CSS

## Common Mistakes to Avoid

❌ **Writing code before tests**
- Write test first, see it fail, then implement

❌ **Generic component names**
- Use `PositionInput` not `Input2` or `CustomInput`

❌ **Skipping accessibility**
- Always include labels, ARIA attributes, keyboard support

❌ **Premature abstraction**
- Wait until you have 3 uses before creating abstraction

❌ **Large components**
- If component > 200 lines, consider splitting

❌ **Direct commits to develop/main**
- Always use feature branches and PRs

❌ **Skipping mobile testing**
- Test responsive design before submitting PR

❌ **Console.log in production**
- Remove all debug logging before merge

## Need Help?

1. Check [Constitution](./.specify/memory/constitution.md) for principles
2. Review [README](./README.md) for setup and overview
3. Look at existing components for patterns
4. Check `/specs` for feature documentation
5. Open an issue for questions

## Quick Win Checklist for New Developers

Week 1:
- [ ] Read Constitution thoroughly
- [ ] Set up development environment
- [ ] Run existing tests successfully
- [ ] Build a simple UI component with tests
- [ ] Submit first PR (documentation or small fix)

Week 2:
- [ ] Pick up small feature task
- [ ] Follow full TDD cycle
- [ ] Test accessibility with keyboard and screen reader
- [ ] Get PR reviewed and merged to develop

Week 3:
- [ ] Lead feature specification session
- [ ] Implement medium-sized feature
- [ ] Review another developer's PR
- [ ] Contribute to component library

Remember: **Quality over speed. Tests are not optional. Accessibility matters.**
