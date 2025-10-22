# Project Setup Guide

This guide walks you through setting up the JobE Frontend project from scratch.

## Initial Setup (First Time Only)

### 1. Create Next.js Application

```bash
# From the project root
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
```

Answer the prompts:
- ✓ TypeScript: **Yes**
- ✓ ESLint: **Yes**
- ✓ Tailwind CSS: **Yes**
- ✓ `src/` directory: **Yes**
- ✓ App Router: **Yes**
- ✓ Import alias (@/*): **Yes**
- ✓ Customize import alias: **No** (use default @/*)

### 2. Install Additional Dependencies

```bash
# Testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom

# Playwright for E2E testing
npm install --save-dev @playwright/test

# Additional utilities (add as needed, keep minimal per constitution)
npm install clsx tailwind-merge
npm install --save-dev @types/node
```

### 3. Configure Jest

Create `jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-dom'
```

### 4. Configure Playwright

```bash
# Initialize Playwright
npx playwright install
```

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 5. Configure TypeScript Strict Mode

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    },
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 6. Configure ESLint

Update `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error"
  }
}
```

### 7. Configure Prettier

Create `.prettierrc`:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 80,
  "arrowParens": "always"
}
```

Create `.prettierignore`:

```
node_modules
.next
out
build
dist
coverage
.vercel
```

### 8. Update package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "prepare": "husky install"
  }
}
```

### 9. Set Up Git Hooks (Optional but Recommended)

```bash
# Install husky for git hooks
npm install --save-dev husky lint-staged

# Initialize husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

Create `.lintstagedrc.json`:

```json
{
  "*.{ts,tsx,js,jsx}": [
    "eslint --fix",
    "prettier --write",
    "jest --bail --findRelatedTests"
  ],
  "*.{json,md}": ["prettier --write"]
}
```

### 10. Create Initial Project Structure

```bash
# Create directory structure
mkdir -p src/components/ui
mkdir -p src/components/forms
mkdir -p src/components/layouts
mkdir -p src/lib
mkdir -p src/types
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p specs
mkdir -p public/images
```

### 11. Create Utility Files

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Create `src/types/index.ts`:

```typescript
// Global type definitions
export type {};
```

### 12. Update Tailwind Configuration (Optional)

Update `tailwind.config.ts` with custom theme if needed:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors for JobE branding
      },
    },
  },
  plugins: [],
};
export default config;
```

### 13. Create Sample Component with Tests

Create `src/components/ui/Button.tsx`:

```typescript
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500':
            variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500':
            variant === 'secondary',
          'border-2 border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500':
            variant === 'outline',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

Create `tests/unit/Button.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies primary variant styles by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByText('Primary');
    expect(button).toHaveClass('bg-blue-600');
  });

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText('Secondary');
    expect(button).toHaveClass('bg-gray-200');
  });

  it('is keyboard accessible', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Accessible</Button>);
    
    const button = screen.getByText('Accessible');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });
});
```

### 14. Verify Setup

```bash
# Type check
npm run type-check

# Run linter
npm run lint

# Run tests
npm test

# Start development server
npm run dev
```

### 15. Commit Initial Setup

```bash
# Stage files
git add .

# Commit
git commit -m "chore: initialize Next.js project with testing infrastructure

- Set up Next.js 14 with App Router and TypeScript
- Configure Jest and React Testing Library
- Configure Playwright for E2E testing
- Enable TypeScript strict mode
- Configure ESLint and Prettier
- Add sample Button component with tests
- Create project directory structure
- Add npm scripts for testing and quality checks

All tests passing and type-safe."
```

## Next Steps

1. **Review the Constitution**: Read `.specify/memory/constitution.md` thoroughly
2. **Check Quick Reference**: Review `QUICK_REFERENCE.md` for development guidelines
3. **Start with a Feature**: Use `/speckit.specify` to create your first feature specification
4. **Follow TDD**: Remember, tests before code (non-negotiable)
5. **Keep It Simple**: Minimal dependencies, clean code, YAGNI principles

## Troubleshooting

### Tests Fail After Setup
- Ensure all dependencies installed: `npm install`
- Clear Next.js cache: `rm -rf .next`
- Check Node version: `node --version` (should be 18+)

### Type Errors
- Run `npm run type-check` to see all errors
- Ensure `tsconfig.json` paths are correct
- Check `@types` packages are installed

### Lint Errors
- Run `npm run format` to auto-fix formatting
- Run `npm run lint` to see issues
- Fix any remaining issues manually

## Constitution Compliance

This setup follows all constitution principles:
- ✅ **Component-First**: Sample Button component is reusable
- ✅ **TDD**: Jest and RTL configured, sample tests included
- ✅ **Clean Code**: TypeScript strict mode, ESLint configured
- ✅ **Progressive UX**: Tailwind for clean UI
- ✅ **Accessibility**: Focus management, semantic HTML
- ✅ **Branch Strategy**: develop branch created

You're ready to start building! 🚀
