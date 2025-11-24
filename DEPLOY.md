# 🚀 Deployment Təlimatları

## Vercel Deployment (Frontend + Backend)

### 1. Vercel Account yaradın
- [vercel.com](https://vercel.com) üzərindən qeydiyyatdan keçin
- GitHub account ilə bağlayın

### 2. Repository-ni GitHub-a yükləyin
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 3. Vercel-də deploy edin
1. Vercel dashboard-da "New Project" basın
2. GitHub repository-nizi seçin
3. Root Directory: `.` (project root)
4. Build Command: `cd backend && npm install && npm run build`
5. Output Directory: `frontend`
6. Install Command: `cd backend && npm install`
7. Deploy edin!

### 4. Environment Variables (lazım olarsa)
Vercel dashboard-da Settings > Environment Variables:
- `NODE_ENV=production`
- `PORT=3000` (Vercel avtomatik təyin edir)

---

## Render Deployment (Backend üçün daha yaxşıdır)

### 1. Render Account yaradın
- [render.com](https://render.com) üzərindən qeydiyyatdan keçin

### 2. New Web Service yaradın
1. "New" > "Web Service" seçin
2. GitHub repository-nizi bağlayın
3. Settings:
   - **Name**: `draw-guess-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: `backend`

### 3. Environment Variables
- `NODE_ENV=production`
- `PORT=10000` (Render default port)

### 4. Frontend-i Vercel-də deploy edin
Frontend-i Vercel-də deploy edin və API URL-ni dəyişdirin:

```javascript
// frontend/app.js
const API_URL = "https://your-backend.onrender.com/api";
```

---

## Railway Deployment (Alternativ)

### 1. Railway Account
- [railway.app](https://railway.app) üzərindən qeydiyyatdan keçin

### 2. New Project
1. "New Project" > "Deploy from GitHub repo"
2. Repository-nizi seçin
3. Root Directory: `backend`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`

---

## Ən Asan Yol: Render (Tövsiyə olunur)

1. **Backend**: Render-də deploy edin
2. **Frontend**: Vercel-də deploy edin
3. Frontend-də API URL-ni dəyişdirin

### Frontend API URL dəyişdirmək:
```javascript
// frontend/app.js - səhifənin başında
const API_URL = process.env.API_URL || "https://your-backend.onrender.com/api";
```

Vercel-də environment variable kimi:
- `API_URL=https://your-backend.onrender.com/api`

---

## Local Test (Production Build)

```bash
# Backend build
cd backend
npm run build
npm start

# Frontend (static files)
# Backend artıq frontend-i serve edir
```

---

## Qeyd

- **Vercel**: Frontend üçün ən yaxşıdır (free tier)
- **Render**: Backend üçün ən yaxşıdır (free tier, 15 dəqiqə idle sonra sleep)
- **Railway**: Daha stabil, amma free tier məhdud

**Tövsiyə**: Backend-i Render-də, Frontend-i Vercel-də deploy edin!


