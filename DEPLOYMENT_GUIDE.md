# Deployment Guide - ChatBot with Supabase

## Overview

This application has been migrated from MongoDB to **Supabase** (PostgreSQL) and is ready for deployment on **Vercel**. This guide covers the complete setup and deployment process.

---

## Prerequisites

- ✅ Supabase account with database tables already created
- ✅ Supabase API keys (already in your `.env`)
- ✅ Vercel account
- ✅ Git repository connected to Vercel
- ✅ Node.js 18+ installed locally

---

## Local Development Setup

### 1. Install Dependencies

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 2. Configure Environment Variables

#### Backend (.env)
Already configured with Supabase keys:
```
SUPABASE_URL=https://lujgisvmfknashmiwssp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
SUPABASE_ANON_KEY=<your_anon_key>
JWT_SECRET=<your_jwt_secret>
```

#### Frontend (.env.local)
Create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:5005
```

### 3. Start Local Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Server runs on http://localhost:5005
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5175
```

### 4. Test Login

Use the test credentials:
- **Normal User:** user@test.com / password123
- **Admin User:** admin@test.com / admin123

---

## Test User Management

### Create/Reset Test Users

```bash
cd backend
node scripts/create_supabase_users.js
```

This will:
- Delete existing test users
- Create fresh test users with proper Supabase encryption

### Add Custom Users

Edit `backend/scripts/create_supabase_users.js` and add to `TEST_USERS` array:
```javascript
{
  name: "Your Name",
  email: "your@email.com",
  password: "securepassword123",
  role: "user", // or "admin"
  subscription: "free", // "pro", "enterprise"
}
```

---

## Database Migration Notes

### Changes from MongoDB to Supabase

#### Removed:
- ❌ MongoDB / Mongoose dependencies
- ❌ `express-mongo-sanitize`
- ❌ Old model files (now stubs for compatibility)
- ❌ MongoDB connection code

#### Added:
- ✅ Supabase SDK (`@supabase/supabase-js`)
- ✅ New UserService with Supabase queries
- ✅ Direct Supabase integration in controllers
- ✅ JWT authentication via UserService

#### Field Name Mappings

MongoDB → Supabase:
- `_id` → `id` (UUID)
- `workType` → `work_type`
- `twoFactorEnabled` → `two_factor_enabled`
- `twoFactorMethod` → `two_factor_method`
- `privacySettings` → Individual boolean columns
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`

### Required Supabase Tables

Ensure these tables exist in your Supabase database:

1. **users**
   - id (uuid, primary key)
   - name (text)
   - email (text, unique)
   - password (text, hashed)
   - role (text: 'user' or 'admin')
   - subscription (text: 'free', 'pro', 'enterprise')
   - work_type (text)
   - notifications (boolean)
   - created_at (timestamp)

2. **chats**
   - id (uuid, primary key)
   - user_id (uuid, foreign key → users.id)
   - title (text)
   - messages (jsonb array)
   - created_at (timestamp)
   - updated_at (timestamp)

3. **security_logs** (optional, for audit trail)
4. **two_factor** (optional, for 2FA functionality)

---

## Vercel Deployment

### 1. Prepare for Deployment

#### Update Backend Configuration

Ensure `backend/.env` has production values:
```bash
NODE_ENV=production
PORT=5005
SUPABASE_URL=https://lujgisvmfknashmiwssp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<production_key>
JWT_SECRET=<strong_random_secret>
```

#### Build Frontend

```bash
cd frontend
npm run build
# Creates optimized build in dist/
```

### 2. Deploy to Vercel

#### Option A: Deploy Frontend Only (Recommended for Full-Stack)

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - **Build Command:** `cd frontend && npm run build`
   - **Output Directory:** `frontend/dist`
   - **Install Command:** `npm install`

3. Set environment variables in Vercel:
   - `VITE_API_URL=https://your-api.vercel.app` (or your production backend URL)

#### Option B: Deploy Backend on Vercel

1. Create `api/[[...path]].js` (already exists in your project)
2. Ensure it imports your Express app correctly
3. Deploy to Vercel - it will automatically route `/api/*` to your backend

### 3. Set Environment Variables in Vercel

Go to **Settings → Environment Variables** and add:

```
SUPABASE_URL=https://lujgisvmfknashmiwssp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
SUPABASE_ANON_KEY=<your_anon_key>
JWT_SECRET=<random_secret_min_32_chars>
GROQ_API_KEY=<your_groq_api_key>
EMAIL_USER=<your_email>
EMAIL_PASS=<your_app_password>
```

### 4. Deploy

Push to your GitHub repository:
```bash
git add .
git commit -m "Migrate to Supabase for production deployment"
git push origin main
```

Vercel will automatically deploy on push to main branch.

---

## Testing Production Deployment

### 1. Test Login Endpoint

```bash
curl -X POST https://your-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "_id": "...",
  "name": "Test User",
  "email": "user@test.com",
  "role": "user",
  "token": "eyJ..."
}
```

### 2. Test Protected Routes

```bash
curl -X GET https://your-api.vercel.app/api/auth/me \
  -H "Authorization: Bearer <token_from_login>"
```

### 3. Monitor Logs

In Vercel Dashboard:
- Go to **Functions** to see serverless function logs
- Go to **Analytics** to see performance metrics

---

## Troubleshooting

### Login Returns 404

**Problem:** Frontend can't reach API
- **Solution:** Check `VITE_API_URL` in frontend environment
- **Verify:** Backend is running on Vercel (check Deployments tab)

### Login Returns 401 (Invalid Credentials)

**Problem:** User not found in Supabase
- **Solution:** Run `node backend/scripts/create_supabase_users.js` to create test users
- **Verify:** Users exist in Supabase dashboard (Tables → users)

### Supabase Connection Failed

**Problem:** Incorrect API keys
- **Solution:** Verify keys match your Supabase project
  1. Go to Supabase Dashboard
  2. Settings → API
  3. Copy correct URLs and keys
  4. Update in Vercel Environment Variables
  5. Redeploy

### "Cannot find module '@supabase/supabase-js'"

**Problem:** Dependencies not installed
- **Solution:** 
  ```bash
  cd backend
  npm install
  git add package-lock.json
  git commit -m "Install Supabase SDK"
  git push
  ```

---

## Performance Optimization

### Backend
- ✅ Supabase auto-scales with PostgreSQL
- ✅ JWT tokens minimize database queries
- ✅ Connection pooling enabled

### Frontend
- ✅ Vite build optimization
- ✅ API proxy reduces CORS issues
- ✅ Session storage for auth state

---

## Security Checklist

- [ ] JWT_SECRET is strong (32+ characters, random)
- [ ] Supabase RLS (Row Level Security) policies configured
- [ ] HTTPS enabled (Vercel provides SSL by default)
- [ ] Environment variables never committed to Git
- [ ] Test users deleted before production
- [ ] Password reset functionality implemented
- [ ] CORS configured appropriately
- [ ] Rate limiting enabled in production

---

## Rollback Plan

If deployment fails:

1. Revert to previous commit:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. Vercel will automatically redeploy previous version

3. Check deployment logs for errors

---

## Support & References

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Express.js:** https://expressjs.com/
- **JWT Guide:** https://jwt.io/

---

## Summary of Migration

| Aspect | Before | After |
|--------|--------|-------|
| Database | MongoDB | Supabase (PostgreSQL) |
| ODM | Mongoose | Supabase SDK |
| Auth | JWT + MongoDB | JWT + Supabase |
| Deployment | Self-hosted | Vercel Serverless |
| Scalability | Manual | Auto-scaling |
| Security | Basic | Enterprise (RLS, SSL) |

---

**Last Updated:** September 10, 2026
**Status:** Production Ready ✅
