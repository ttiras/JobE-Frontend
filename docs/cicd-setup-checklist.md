# CI/CD Pipeline Setup Checklist

**Repository**: https://github.com/ttiras/JobE-Frontend  
**Status**: ✅ Workflows pushed to GitHub  
**Next**: Complete configuration steps below

---

## ✅ Completed Steps

- [x] Workflow files created and committed
- [x] Documentation created
- [x] Commit pushed to `develop` branch
- [x] Playwright config updated for CI

---

## 🔧 Remaining Configuration Steps

### Step 1: Verify Workflows Are Active (2 minutes)

1. Go to: https://github.com/ttiras/JobE-Frontend/actions
2. Verify you see:
   - ✅ **CI** workflow
   - ✅ **E2E Tests** workflow
   - ✅ **Security Scan** workflow

**If workflows don't appear**: They will appear after the first PR or push to `develop`/`main`.

---

### Step 2: Configure Branch Protection Rules (10 minutes)

#### Protect `develop` Branch

1. Go to: https://github.com/ttiras/JobE-Frontend/settings/branches
2. Click **"Add rule"** (or edit existing rule for `develop`)
3. Branch name pattern: `develop`
4. Configure:
   - ✅ **Require pull request reviews before merging**
     - Required approving reviews: `1`
   - ✅ **Require status checks to pass before merging**
     - Check: **"Require branches to be up to date before merging"**
     - In "Status checks that are required", search for and select:
       - `CI / quality-checks`
     - Optional (can add later):
       - `E2E Tests / e2e`
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Do not allow bypassing the above settings**
5. Click **"Create"** or **"Save changes"**

#### Protect `main` Branch

1. Click **"Add rule"** again
2. Branch name pattern: `main`
3. Configure:
   - ✅ **Require pull request reviews before merging**
     - Required approving reviews: `2`
   - ✅ **Require status checks to pass before merging**
     - Check: **"Require branches to be up to date before merging"**
     - In "Status checks that are required", search for and select:
       - `CI / quality-checks`
       - `Security Scan / audit`
       - `E2E Tests / e2e` (if available)
   - ✅ **Require conversation resolution before merging**
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Do not allow bypassing the above settings**
4. Click **"Create"** or **"Save changes"**

**Note**: Status checks will only appear after workflows have run at least once. You may need to create a test PR first.

---

### Step 3: Configure Vercel Integration (15 minutes)

#### Option A: Vercel GitHub Integration (Recommended)

1. Go to: https://vercel.com/dashboard
2. Click **"Add New Project"**
3. Import repository: `ttiras/JobE-Frontend`
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install`
5. Configure environment variables:
   - Click **"Environment Variables"**
   - Add:
     - `NEXT_PUBLIC_NHOST_SUBDOMAIN` = (your value)
     - `NEXT_PUBLIC_NHOST_REGION` = (your value)
     - Add any other required variables
6. Configure branch deployments:
   - **Production Branch**: `main`
   - **Preview Branches**: `develop` and all feature branches
7. Click **"Deploy"**

**Result**: 
- ✅ Automatic deployments on push to `main` (production)
- ✅ Automatic deployments on push to `develop` (preview/staging)
- ✅ Preview URLs for all PRs

---

### Step 4: Configure GitHub Secrets (Optional, 5 minutes)

Only needed if you want E2E tests to run against deployed URLs.

1. Go to: https://github.com/ttiras/JobE-Frontend/settings/secrets/actions
2. Click **"New repository secret"**
3. Add secrets (if you have deployed URLs):
   - `STAGING_URL`: Your staging environment URL
   - `PRODUCTION_URL`: Your production environment URL

**Note**: If not set, E2E tests will use `http://localhost:3000` (for local testing only).

---

### Step 5: Test the Pipeline (10 minutes)

#### Test CI Workflow

1. Create a test feature branch:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b test-cicd-pipeline
   ```

2. Make a small change (e.g., add a comment to README.md)

3. Commit and push:
   ```bash
   git add .
   git commit -m "test: Verify CI pipeline"
   git push origin test-cicd-pipeline
   ```

4. Create a PR to `develop`:
   - Go to: https://github.com/ttiras/JobE-Frontend/compare/develop...test-cicd-pipeline
   - Click **"Create pull request"**
   - Verify PR template appears
   - Fill out the checklist

5. Verify:
   - ✅ CI workflow runs automatically (check Actions tab)
   - ✅ All quality checks pass
   - ✅ PR shows status checks

#### Test Failure Scenario (Optional)

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

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] Workflows appear in GitHub Actions tab
- [ ] CI workflow runs on PR creation
- [ ] All quality checks pass
- [ ] Branch protection rules are active
- [ ] PRs require passing checks before merge
- [ ] Vercel integration connected (if using)
- [ ] Deployments trigger on push to `develop`/`main`
- [ ] PR template appears on new PRs

---

## 🎯 Quick Links

- **Repository**: https://github.com/ttiras/JobE-Frontend
- **Actions**: https://github.com/ttiras/JobE-Frontend/actions
- **Branch Settings**: https://github.com/ttiras/JobE-Frontend/settings/branches
- **Secrets**: https://github.com/ttiras/JobE-Frontend/settings/secrets/actions
- **Vercel Dashboard**: https://vercel.com/dashboard

---

## 📚 Documentation

- [Quick Start Guide](./cicd-quick-start.md)
- [Implementation Plan](./cicd-pipeline-implementation-plan.md)
- [Summary](./cicd-pipeline-summary.md)

---

## 🆘 Troubleshooting

### Workflows Don't Appear

**Solution**: Workflows will appear after:
- First PR is created, OR
- First push to `develop` or `main` branch

### Status Checks Don't Appear in Branch Protection

**Solution**: Status checks only appear after workflows have run at least once. Create a test PR first, then configure branch protection.

### CI Workflow Fails

**Check**:
1. Go to Actions tab → Click on failed workflow
2. Review error messages
3. Common issues:
   - Missing dependencies
   - TypeScript errors
   - Test failures
   - Build errors

### Vercel Not Deploying

**Check**:
1. Vercel dashboard → Project settings
2. Verify GitHub integration is connected
3. Check deployment logs for errors
4. Verify environment variables are set

---

**Status**: ✅ Ready for Configuration  
**Last Updated**: 2025-01-XX

