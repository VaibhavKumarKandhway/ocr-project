# CuraSense OCR App – Full Deployment Guide

## Problem
Your frontend is deployed on Netlify (https://ocr-app-prototype.netlify.app), but **text extraction is not working** because:
- The frontend calls `http://localhost:3000/api/v1` (hardcoded to local backend)
- Your backend is **not deployed** — it only runs locally on your machine
- Netlify can't reach `localhost:3000`

**Solution:** Deploy your backend publicly, then update the frontend to point to it.

---

## Step 1: Deploy Backend to Render (Free)

### Why Render?
- Free tier (hibernates after 15 min inactivity, wakes on request)
- Easy Git-based deploys
- Works well with Node.js/Express

### Steps

1. **Create Render account**
   - Go to https://render.com
   - Sign up with GitHub or email

2. **Connect your GitHub repo**
   - If you haven't pushed your repo to GitHub yet:
     ```powershell
     cd d:\ocr-project\ocr-app
     git remote add origin https://github.com/VaibhavKumarKandhway/ocr-project.git
     git branch -M main
     git push -u origin main
     ```
   - Go to https://dashboard.render.com → New → Web Service
   - Select your GitHub repo (ocr-project)
   - Choose deployment branch: `main`

3. **Configure the Web Service**
   - **Name:** `ocr-app-backend` (or any name)
   - **Runtime:** Node
   - **Build command:** `npm install` (leave as-is)
   - **Start command:** `node backend/src/server.js`
   - **Plan:** Free (or Starter if free hibernates too much)
   - Click **Create Web Service**

4. **Get your Render URL**
   - After deployment, Render shows your live URL like: `https://ocr-app-backend.onrender.com`
   - Test it: `curl https://ocr-app-backend.onrender.com/` should return JSON with endpoint info

### Alternative: Deploy to Heroku, Railway, or Azure App Service
- **Heroku:** Free tier ending Nov 2024; now paid only
- **Railway:** https://railway.app (simple, free tier available)
- **Azure App Service:** Free tier available with student/free account

---

## Step 2: Redeploy Frontend with Backend URL

### Using prepare_deploy.ps1 (Recommended)

1. **Prepare dist folder with your backend URL**
   ```powershell
   cd d:\ocr-project\ocr-app\frontend
   .\prepare_deploy.ps1 -BackendUrl "https://ocr-app-backend.onrender.com"
   ```
   This:
   - Copies `public/`, `src/app.js`, `src/styles.css` to `frontend/dist/`
   - Injects `window.__API_BASE__` into `index.html` with your backend URL
   - Updates script paths

2. **Deploy to Netlify**
   ```powershell
   npx netlify-cli deploy --prod --dir=dist
   ```

3. **Verify**
   - Open https://ocr-app-prototype.netlify.app
   - Try uploading an image
   - Check browser console (`F12` → Console) for any errors

### Manual deployment (if prepare_deploy.ps1 fails)

1. Edit `frontend/src/app.js` line 1:
   ```javascript
   const API_BASE = 'https://ocr-app-backend.onrender.com/api/v1';
   ```

2. Rebuild dist:
   ```powershell
   cd d:\ocr-project\ocr-app\frontend
   .\prepare_deploy.ps1
   ```

3. Deploy:
   ```powershell
   npx netlify-cli deploy --prod --dir=dist
   ```

---

## Step 3: Verify Deployment

### Test text extraction
1. Go to https://ocr-app-prototype.netlify.app
2. Upload a prescription image
3. Click "Extract Text & Analyze 🔍"
4. Results should appear (not errors)

### If it still fails:
- **Open browser DevTools** (`F12`)
- **Network tab:** Look for failed requests to `https://ocr-app-backend.onrender.com/api/v1/report/upload-image`
- **Common errors:**
  - `CORS` error → Backend CORS not configured (check `backend/src/server.js` has `app.use(cors())`)
  - `404 Not Found` → Backend URL is wrong or endpoint doesn't exist
  - `503 Service Unavailable` → Backend is hibernating (Render free tier); wait 30s and retry

---

## Optional: Enable Auto-Deploy on Git Push

### Option A: Netlify (recommended for frontend)
1. In Netlify UI (https://app.netlify.com):
   - Site Settings → Build & deploy → Repository
   - Connect to your GitHub repo
   - Build command: `# (leave blank or add a custom build)`
   - Publish directory: `frontend/dist/`
   - Every `git push` will trigger redeploy (after you prepare dist locally once)

### Option B: Render (for backend)
- Render auto-deploys from GitHub on `git push` to configured branch
- No extra setup needed

---

## Environment Variables (if needed later)

If you want to avoid hardcoding URLs:

### For Frontend (Netlify):
1. Site Settings → Build & deploy → Environment
2. Add: `REACT_APP_API_BASE = https://ocr-app-backend.onrender.com`
3. Then in `app.js`:
   ```javascript
   const API_BASE = window.__API_BASE__ || process.env.REACT_APP_API_BASE || 'https://ocr-app-backend.onrender.com/api/v1';
   ```

### For Backend (Render):
1. Web Service → Environment
2. Add: `NODE_ENV = production`
3. Add: `TESSERACT_WORKER_URL = ...` (if needed for Tesseract)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot POST /api/v1/report/upload-image" | Backend not deployed or URL wrong in frontend |
| CORS error | Add backend URL to frontend; check CORS enabled in `backend/src/server.js` |
| Render shows 503 Service Unavailable | Free tier hibernated; wait 30s for cold start |
| Upload stuck/timeout | File too large or backend processing slow; check Render logs |
| `npm install` fails on Render | Missing Node version; add `engines` to `backend/package.json` |

---

## Quick Reference: Commands

```powershell
# Prepare frontend with backend URL
cd d:\ocr-project\ocr-app\frontend
.\prepare_deploy.ps1 -BackendUrl "https://your-backend-url"

# Deploy frontend to Netlify
npx netlify-cli deploy --prod --dir=dist

# Check Netlify status
npx netlify-cli status

# View Netlify site logs
npx netlify-cli logs
```

---

## Next Steps

1. **Deploy backend** (Step 1 above) → Get Render URL
2. **Redeploy frontend** with backend URL (Step 2) → Push to Netlify
3. **Test** → Open Netlify URL and try extract text
4. **Share URL:** https://ocr-app-prototype.netlify.app

Good luck! 🚀
