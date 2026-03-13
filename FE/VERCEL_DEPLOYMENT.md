# Vercel Deployment Guide with Shared Package

## Overview
This frontend uses a monorepo structure with a shared package (`@eyewear/shared`) that contains common types, enums, and utilities.

## What Changed

### 1. `package.json`
- Updated `@eyewear/shared` dependency to use `file:` protocol
- Added `build:shared` script to build the shared package before building the frontend

```json
{
  "scripts": {
    "build": "npm run build:shared && vite build",
    "build:shared": "cd ../packages/shared && npm run build"
  },
  "dependencies": {
    "@eyewear/shared": "file:../packages/shared"
  }
}
```

### 2. `vercel.json`
Created Vercel configuration to specify the build output directory.

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 3. `vite.config.js`
Updated to use the built `dist` files in production and source files in development.

```js
'@eyewear/shared': process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, '../packages/shared/dist/esm')
  : path.resolve(__dirname, '../packages/shared/src')
```

## Deploy to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. From the `FE` directory:
   ```bash
   cd FE
   vercel
   ```

3. Follow the prompts to set up your project.

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New Project"
3. Import your Git repository
4. **Important**: Set "Root Directory" to `FE`
5. **Build Command**: `npm run build` (auto-detected from vercel.json)
6. **Output Directory**: `dist` (auto-detected from vercel.json)
7. Click "Deploy"

### Option 3: Deploy from Root (Monorepo)

If deploying from the repository root:

1. Set **Root Directory** to `FE`
2. Set **Build Command** to `cd FE && npm run build`
3. Set **Output Directory** to `FE/dist`

## Environment Variables

Make sure to set these in Vercel:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your backend API URL (e.g., `https://api.example.com`) |

Add these in Vercel Dashboard: **Settings > Environment Variables**

## Troubleshooting

### "Cannot find module '@eyewear/shared'"
- Ensure the shared package is built: `cd packages/shared && npm run build`
- Check that `FE/package.json` has `"@eyewear/shared": "file:../packages/shared"`

### "Failed to resolve import"
- Verify the vite.config.js alias is correct
- Check that the shared package dist folder exists

### Build fails on Vercel but works locally
- The `build:shared` script runs automatically in the `build` command
- Check Vercel build logs to see if the shared package built successfully

## Local Testing Before Deploy

Test the production build locally:

```bash
cd FE
npm run build
npm run preview
```

Then visit `http://localhost:4173` to verify.
