# 🚀 Resume Assistant - Automated Deployment Guide

This guide will get your Resume Assistant live in **less than 30 minutes** with zero manual config!

---

## **Phase 1: Prerequisites Setup (5 minutes)**

### 1.1: Create Accounts (if you don't have them)

- **Vercel:** https://vercel.com (sign up with GitHub)
- **Railway:** https://railway.app (sign up with GitHub)
- **MongoDB Atlas:** https://mongodb.com/cloud/atlas (sign up with email)

### 1.2: Generate API Keys

**Anthropic Claude API Key:**
1. Go to https://console.anthropic.com/
2. Click "API Keys"
3. Create new key
4. Copy it (save for later)

---

## **Phase 2: MongoDB Setup (5 minutes)**

### 2.1: Create MongoDB Cluster

1. Go to **mongodb.com/cloud/atlas**
2. Create free M0 cluster
3. Choose region: **Asia Pacific (ap-southeast-1)** (closest to Bangalore)

### 2.2: Create Database User

1. Go to **Database Access**
2. Click **"Add New Database User"**
3. Username: `resume_user`
4. Password: Generate secure password (copy it!)
5. Click **"Add User"**

### 2.3: Get Connection String

1. Go to **Databases**
2. Click **"Connect"** 
3. Choose **"Drivers"** → **"Node.js"**
4. Copy the connection string:
   ```
   mongodb+srv://resume_user:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `PASSWORD` with your actual password
6. Save this URL (you'll need it!)

---

## **Phase 3: Railway Setup (10 minutes)**

### 3.1: Deploy Backend

1. Go to https://railway.app
2. Click **"Create Project"**
3. Select **"Deploy from GitHub"**
4. Authorize & select **`Swas00/resume-assistant`**
5. Railway auto-detects it's a monorepo

### 3.2: Configure Backend

1. Click on the **backend** service
2. Go to **Settings**
3. Set **Root Directory** to: `backend`
4. Save

### 3.3: Add Environment Variables (Backend)

Click **Variables** and add:

```
MONGODB_URI=mongodb+srv://resume_user:YOUR_PASSWORD@cluster.mongodb.net/resume-assistant?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-12345
ANTHROPIC_API_KEY=sk-ant-your-claude-api-key-here
AI_SERVICE_URL=https://your-ai-service-url.up.railway.app
PORT=3000
NODE_ENV=production
```

Save and Railway auto-deploys! ✅

### 3.4: Get Backend URL

1. Go to **Settings** tab
2. Copy the **Public URL** (looks like: `https://resume-assistant-backend.up.railway.app`)
3. Save it!

### 3.5: Deploy AI Service

1. Create **new Railway project**
2. Select **"Deploy from GitHub"**
3. Select **`Swas00/resume-assistant`** repo
4. Click on **ai-service** service
5. Set **Root Directory** to: `ai-service`
6. Railway auto-detects Python and deploys!

### 3.6: Get AI Service URL

1. Go to **Settings**
2. Copy the **Public URL** (looks like: `https://resume-assistant-ai.up.railway.app`)
3. Save it!

### 3.7: Update Backend AI Service URL

1. Go back to **backend** service
2. Click **Variables**
3. Update `AI_SERVICE_URL` with the AI service URL you just got
4. Save

---

## **Phase 4: Vercel Setup (5 minutes)**

### 4.1: Deploy Frontend

1. Go to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Select **`Swas00/resume-assistant`** repo
4. Under **"Root Directory"** → Select **`frontend`**

### 4.2: Add Environment Variables

Add under **Environment Variables**:

```
VITE_API_URL=https://your-backend-url.up.railway.app
```

(Use the backend URL you saved from Railway!)

### 4.3: Deploy

Click **"Deploy"**

Vercel auto-detects React + Vite and deploys in ~2 minutes! ✅

### 4.4: Get Frontend URL

Copy your frontend URL (looks like: `https://resume-assistant.vercel.app`)

---

## **Phase 5: Test Everything (5 minutes)**

### 5.1: Test Frontend

Go to: `https://resume-assistant.vercel.app`

You should see the login page ✅

### 5.2: Test Backend

```bash
curl https://your-backend-url.up.railway.app/api/auth/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
```

Should get a response (may error on email verification, that's OK) ✅

### 5.3: Test AI Service

```bash
curl https://your-ai-service-url.up.railway.app/health
```

Should return: `{"status":"ok"}` ✅

---

## **Phase 6: Enable Auto-Deployment (Optional but Recommended)**

### 6.1: Add GitHub Secrets (for automatic CI/CD)

Go to your GitHub repo:
1. **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

```
RAILWAY_TOKEN         = (get from railway.app/account/tokens)
VERCEL_TOKEN          = (get from vercel.com/account/tokens)
VERCEL_ORG_ID         = (get from vercel dashboard)
VERCEL_PROJECT_ID_FRONTEND = (get from vercel project settings)
```

### 6.2: GitHub Actions Auto-Deploy

Now every time you push to `main`, it automatically:
1. ✅ Runs all tests
2. ✅ Deploys backend to Railway
3. ✅ Deploys frontend to Vercel
4. ✅ Deploys AI service to Railway

---

## **Your Live URLs**

| Component | URL |
|-----------|-----|
| **Frontend** | https://resume-assistant.vercel.app |
| **Backend API** | https://your-backend-url.up.railway.app |
| **AI Service** | https://your-ai-service-url.up.railway.app |

---

## **Costs**

| Service | Cost |
|---------|------|
| Vercel | FREE (unlimited) |
| Railway | $5/month or pay-as-you-go (free tier available) |
| MongoDB Atlas | FREE (512MB) |
| **Total** | **FREE - $5/month** |

---

## **🎯 What's Next?**

1. ✅ System is live!
2. 🚀 Start building **Sprint 2.4: Interview Prep Bot**
3. 📊 Every push to `main` = auto-deploys new features
4. 📈 Monitor deployments on Railway/Vercel dashboards

---

## **Troubleshooting**

### Frontend shows blank page
- Check `VITE_API_URL` in Vercel environment variables
- Rebuild: Vercel dashboard → Deployments → Redeploy

### Backend connection timeout
- Check `MONGODB_URI` is correct in Railway variables
- Check all services are running in Railway dashboard
- Rebuild: Railway dashboard → Redeploy

### AI Service not responding
- Check `AI_SERVICE_URL` in backend Railway variables
- Go to Railway dashboard → ai-service → Logs
- Look for startup errors

### Need to rollback?
1. Go to Railway/Vercel dashboard
2. Click on previous deployment
3. Click **"Redeploy"**

---

## **Next: Interview Prep Bot** 🤖

Once deployment is verified, I'll build:
- Mock interview questions
- STAR method evaluation
- Real-time feedback
- WebSocket integration

**Ready?** Let me know when all 3 services are live! 🚀
