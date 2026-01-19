# Deployment Guide (Vercel)

This application is built with **Next.js**, which makes it "Zero Configuration" to deploy on Vercel.

## Prerequisites
1. You have a [GitHub account](https://github.com).
2. You have pushed your latest code to a GitHub repository (Already done!).

## Steps to Deploy

### 1. Create Vercel Account
1. Go to [vercel.com](https://vercel.com).
2. Sign up / Log in using your **GitHub** account.

### 2. Import Project
1. On your Vercel dashboard, click **"Add New..."** -> **"Project"**.
2. Assuming you connected your GitHub, you will see a list of your repositories.
3. Find **`caged`** (or your repo name) and click **"Import"**.

### 3. Configure & Deploy
1. **Framework Preset**: Vercel should automatically detect `Next.js`.
2. **Root Directory**: Leave as `./` (default).
3. **Environment Variables**: currently we don't have any secrets (like API keys) yet, so you can skip this.
    - *Note: In the future, this is where you will add `STRIPE_SECRET_KEY` and `DATABASE_URL`.*
4. Click **"Deploy"**.

### 4. Wait & Verify
1. Vercel will run `npm install` and `npm run build`.
2. Within 1-2 minutes, you will get a live URL (e.g., `https://caged-app.vercel.app`).
3. Click the link and verify your Fretboard app works!

## Future Updates
- Every time you `git push` to your `main` branch, Vercel will **automatically** re-deploy your new changes.
