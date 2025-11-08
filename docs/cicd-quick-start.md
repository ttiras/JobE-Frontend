# CI/CD Pipeline Quick Start Guide

**Status**: ✅ Ready to Deploy  
**Time to Setup**: 15-30 minutes

---

## Prerequisites

- ✅ GitHub repository with `develop` and `main` branches
- ✅ Vercel account (for deployments)
- ✅ Admin access to GitHub repository settings

---

## Step 1: Verify Workflow Files (5 minutes)

The following workflow files have been created:

- ✅ `.github/workflows/ci.yml` - Quality checks
- ✅ `.github/workflows/e2e.yml` - E2E tests
- ✅ `.github/workflows/security.yml` - Security scanning
- ✅ `.github/pull_request_template.md` - PR template

**Action**: Verify these files exist and commit them to your repository.

```bash
git add .github/
git commit -m "feat: Add CI/CD pipeline workflows"
git push origin develop
```

---

## Step 2: Configure Vercel Integration (10 minutes)

### Option A: Vercel GitHub Integration (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `pnpm build` (or leave default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install`

5. Configure environment variables:
   - `NEXT_PUBLIC_NHOST_SUBDOMAIN`
   - `NEXT_PUBLIC_NHOST_REGION`
   - Any other required variables

6. Configure branch deployments:
   - **Production Branch**: `main`
   - **Preview Branches**: `develop` and all feature branches

7. Click **"Deploy"**

**Result**: 
- ✅ Automatic deployments on push to `main` (production)
- ✅ Automatic deployments on push to `develop` (preview/staging)
- ✅ Preview URLs for all PRs

### Option B: Manual Vercel CLI Setup (Alternative)

If you prefer using GitHub Actions for deployment:

1. Install Vercel CLI: `pnpm add -D vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Get credentials:
   - `vercel token` → Save as `VERCEL_TOKEN` secret
   - Project ID from `.vercel/project.json` → Save as `VERCEL_PROJECT_ID` secret
   - Org ID from `.vercel/project.json` → Save as `VERCEL_ORG_ID` secret

5. Add secrets to GitHub:
   - Go to Repository Settings → Secrets and variables → Actions
   - Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

6. Create `.github/workflows/deploy.yml` (see implementation plan)

---

## Step 3: Configure GitHub Secrets (5 minutes)

### Required Secrets

Go to **Repository Settings → Secrets and variables → Actions** and add:

#### For E2E Tests (Optional)
- `STAGING_URL`: Your staging environment URL
- `PRODUCTION_URL`: Your production environment URL

**Note**: If not set, E2E tests will use `http://localhost:3000` (for local testing only)

---

## Step 4: Configure Branch Protection (10 minutes)

### Protect `develop` Branch

1. Go to **Repository Settings → Branches**
2. Click **"Add rule"** or edit existing rule for `develop`
3. Configure:
   - ✅ **Require pull request reviews before merging**
     - Required approving reviews: `1`
   - ✅ **Require status checks to pass before merging**
     - Required checks:
       - `CI / quality-checks`
     - Optional checks:
       - `E2E Tests / e2e`
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Do not allow bypassing the above settings**

4. Click **"Save changes"**

### Protect `main` Branch

1. Add/edit rule for `main`
2. Configure:
   - ✅ **Require pull request reviews before merging**
     - Required approving reviews: `2`
   - ✅ **Require status checks to pass before merging**
     - Required checks:
       - `CI / quality-checks`
       - `Security Scan / audit`
       - `E2E Tests / e2e`
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Require conversation resolution before merging**
   - ✅ **Do not allow bypassing the above settings**

3. Click **"Save changes"**

---

## Step 5: Test the Pipeline (5 minutes)

### Test CI Workflow

1. Create a test feature branch:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b test-cicd-pipeline
   ```

2. Make a small change (e.g., update README)

3. Commit and push:
   ```bash
   git add .
   git commit -m "test: Verify CI pipeline"
   git push origin test-cicd-pipeline
   ```

4. Create a PR to `develop`

5. Verify:
   - ✅ CI workflow runs automatically
   - ✅ All quality checks pass
   - ✅ PR template appears

### Test Failure Scenario

1. In your test branch, introduce a TypeScript error:
   ```typescript
   // In any .ts file
   const x: string = 123; // Type error
   ```

2. Commit and push:
   ```bash
   git add .
   git commit -m "test: Introduce type error"
   git push origin test-cicd-pipeline
   ```

3. Verify:
   - ✅ CI workflow runs
   - ✅ Type check fails
   - ✅ PR shows failed check
   - ✅ PR cannot be merged (if branch protection is enabled)

4. Fix the error and verify PR can be merged

---

## Step 6: Verify Deployment (5 minutes)

### Test Staging Deployment

1. Merge your test PR to `develop`
2. Verify:
   - ✅ Vercel deploys to preview/staging
   - ✅ Deployment URL is accessible
   - ✅ E2E tests run (if configured)

### Test Production Deployment

1. Create PR from `develop` to `main`
2. Verify:
   - ✅ All checks pass
   - ✅ Requires approvals (if configured)
3. Merge to `main`
4. Verify:
   - ✅ Vercel deploys to production
   - ✅ Production URL is accessible

---

## Troubleshooting

### CI Workflow Not Running

**Problem**: Workflows don't trigger on PR

**Solution**:
- Verify workflow files are in `.github/workflows/`
- Check file syntax (YAML indentation)
- Verify branch names match (`develop`, `main`)
- Check GitHub Actions tab for errors

### Tests Failing Locally but Passing in CI

**Problem**: Environment differences

**Solution**:
- Verify Node.js version matches (20.x)
- Check pnpm version (10.15.0)
- Verify environment variables are set
- Check for platform-specific code

### Deployment Not Triggering

**Problem**: Vercel not deploying

**Solution**:
- Verify Vercel GitHub integration is connected
- Check Vercel project settings
- Verify branch names match configuration
- Check Vercel dashboard for errors

### Branch Protection Blocking Merges

**Problem**: Can't merge even though checks pass

**Solution**:
- Verify all required checks are passing
- Check if branch is up to date (merge or rebase)
- Verify required approvals are given
- Check for conversation resolution requirements

---

## Next Steps

1. ✅ **Monitor First Few PRs**: Watch workflows run and verify everything works
2. ✅ **Adjust Quality Gates**: Fine-tune thresholds if needed
3. ✅ **Add Team Notifications**: Configure Slack/email notifications (optional)
4. ✅ **Document Workflow**: Share pipeline documentation with team

---

## Support

For issues or questions:
- Review [Full Implementation Plan](./cicd-pipeline-implementation-plan.md)
- Check [GitHub Actions Documentation](https://docs.github.com/en/actions)
- Check [Vercel Documentation](https://vercel.com/docs)

---

**Status**: ✅ Ready to Use  
**Last Updated**: 2025-01-XX

