# Vercel Deployment Guide

## Build Configuration

**Standard Build** (recommended):

**Build Command:**
```bash
npm run build
```

**Vercel Settings:**
- Framework Preset: **Vite** (auto-detected)
- Build Command: `npm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)
- Install Command: `npm install` (auto-detected)

**Why Standard Build:**
- ✅ Faster builds and simpler deployment
- ✅ Google can crawl JavaScript SPAs reliably
- ✅ Your meta tags, structured data, and sitemap are already comprehensive
- ✅ Dynamic routes (`/spaces/*`) work perfectly client-side

---

## Vercel Deployment Steps

### 1. Connect Your Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your Git repository
4. Vercel will auto-detect it's a Vite project

### 2. Configure Build Settings

**Root Directory:** `frontend` (if your frontend is in a subdirectory)

**Build Settings:**
- Framework Preset: **Vite** (auto-detected)
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 3. Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_BASE_URL=https://your-backend-api.com
```

**Note:** Your backend should be deployed separately (not on Vercel, since it's FastAPI).

### 4. Deploy

Click **"Deploy"** and Vercel will:
1. Install dependencies
2. Run build command
3. Deploy to CDN
4. Provide you with a URL

---

## Backend Deployment

Your FastAPI backend needs to be deployed separately. Options:

### Option A: Railway / Render / Fly.io
- Deploy FastAPI as a service
- Set up MongoDB (MongoDB Atlas recommended)
- Update `VITE_API_BASE_URL` in Vercel

### Option B: Vercel Serverless Functions (Not Recommended)
- FastAPI doesn't work well with Vercel serverless
- Better to use dedicated Python hosting

---

## SEO Setup

Your app is already optimized for SEO:

1. ✅ Dynamic meta tags per route (`react-helmet-async`)
2. ✅ JSON-LD structured data (CoworkingSpace schema)
3. ✅ Dynamic sitemap.xml (includes all listings)
4. ✅ Proper robots.txt
5. ✅ Canonical URLs

Google can crawl JavaScript SPAs reliably, so SSG is not necessary.

---

## Vercel Configuration

Your `vercel.json` is already set up correctly for:
- ✅ SPA routing (all routes → index.html)
- ✅ Proper headers for sitemap.xml and robots.txt
- ✅ Auto-detection of Vite build

---

## Monitoring SEO on Vercel

1. **Google Search Console**: Submit your sitemap (`https://yourdomain.com/sitemap.xml`)
2. **Vercel Analytics**: Enable in dashboard for performance metrics
3. **Core Web Vitals**: Check in Google Search Console

---

## Troubleshooting

### Build Fails
- Check Node.js version (Vercel uses Node 18+ by default)
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Routes Not Working
- Verify `vercel.json` rewrites are correct
- Check that `index.html` is in `dist/` folder
- Ensure React Router is handling client-side routing

### API Calls Fail
- Verify `VITE_API_BASE_URL` is set correctly
- Check CORS settings on backend
- Ensure backend is accessible from Vercel's CDN

---

## Next Steps

1. **Deploy frontend to Vercel** using standard build
2. **Deploy backend** to Railway/Render/Fly.io
3. **Set up environment variables** in Vercel
4. **Submit sitemap** to Google Search Console
5. **Monitor performance** in Google Search Console
