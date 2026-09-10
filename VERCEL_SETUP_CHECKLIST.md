# Vercel Setup Checklist - Complete Step-by-Step

## What You Need to Do RIGHT NOW

Your code is pushed to GitHub and `vercel.json` is configured. Now you need to:
1. Add environment variables to Vercel
2. Trigger a manual deployment
3. Verify it works

---

## 📋 PART 1: Add Environment Variables (5 minutes)

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Find your project: **Verity_The_Chatbot** (or whatever it's named)
3. Click on it

### Step 2: Go to Settings
1. Click **Settings** tab (top navigation)
2. On left sidebar, click **Environment Variables**

### Step 3: Add Each Variable

**You need to add 6 variables. Copy-paste each one:**

#### Variable 1: SUPABASE_URL
```
Name: SUPABASE_URL
Value: https://lujgisvmfknashmiwssp.supabase.co
```
- Click **Add**

#### Variable 2: SUPABASE_ANON_KEY
```
Name: SUPABASE_ANON_KEY
Value: [GET FROM SUPABASE]
```

**How to get this value:**
1. Go to https://supabase.com/dashboard
2. Select your project: **lujgisvmfknashmiwssp**
3. Click **Settings** (bottom left)
4. Click **API**
5. Copy the **Anon public key**
6. Paste it in Vercel

- Click **Add**

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [GET FROM SUPABASE]
```

**How to get this value:**
1. Same Supabase API page
2. Scroll down to **Service role secret**
3. Copy it
4. Paste in Vercel

- Click **Add**

#### Variable 4: JWT_SECRET
```
Name: JWT_SECRET
Value: [GENERATE RANDOM STRING]
```

**Generate a random string (pick ONE method):**

**On Windows:**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**Or use online generator:** https://www.random.org/strings/

Example value:
```
aB3xY9pQr5kL2mN8vW7xZ1qTuI0jKpLmNoPqRsT4uVwX5yZ6a7bCdEfGhIjKlMn
```

- Click **Add**

#### Variable 5: GROQ_API_KEY
```
Name: GROQ_API_KEY
Value: [YOUR GROQ API KEY]
```

Get your key from: https://console.groq.com/keys

- Click **Add**

#### Variable 6: NODE_ENV
```
Name: NODE_ENV
Value: production
```

- Click **Add**

### Step 4: Verify All Variables Added
You should see 6 variables in the list:
- ✓ SUPABASE_URL
- ✓ SUPABASE_ANON_KEY
- ✓ SUPABASE_SERVICE_ROLE_KEY
- ✓ JWT_SECRET
- ✓ GROQ_API_KEY
- ✓ NODE_ENV

**Do NOT close this page yet!**

---

## 🚀 PART 2: Trigger Manual Deployment

### Step 1: Go to Deployments
1. Click **Deployments** tab (top navigation)
2. You should see a list of deployments

### Step 2: Find Latest Deployment
Look for the most recent one (should show commit message: "Add Vercel configuration")

### Step 3: Redeploy
1. Click the **...** (three dots) on the latest deployment
2. Select **Redeploy**
3. A popup appears, click **Redeploy** again

### Step 4: Wait for Build
You'll see the deployment start:
```
Status: Building...
```

Watch for these stages:
1. `Cloning repository...` ✓
2. `Installing dependencies...` ✓
3. `Building...` ✓
4. `Verifying...` ✓
5. `Ready` ✓

This usually takes 2-3 minutes.

---

## ✅ PART 3: Verify Deployment Success

### When Deployment Shows "Ready"

1. Click on the deployment to view details
2. You should see a URL like: `https://verity-chatbot-xyz.vercel.app`
3. Click that URL to visit your live app

### Test Your App
1. You should see the login page
2. Click **Login**
3. Enter credentials:
   - Email: `user@test.com`
   - Password: `password123`
4. ✓ Should log in successfully!

### If You See 404 Error
- Check the browser console (F12)
- Look for: `[API] Using API URL:`
- It should show your Vercel domain
- If it shows `http://localhost:5005`, environment variables didn't load
- Solution: Redeploy again

---

## 🔍 Troubleshooting

### Build Failed
**What to do:**
1. Click on failed deployment
2. Go to **Logs** tab
3. Read the error message
4. Common fixes:
   - Missing environment variable → Add it and redeploy
   - Dependencies not installed → Usually auto-fixes on redeploy
   - Build command issue → Check vercel.json is correct

### Deployment Stuck on "Building"
**What to do:**
1. Wait up to 5 minutes
2. If still building, click **...** → **Cancel**
3. Try redeploy again

### Login Returns 404
**What to do:**
1. Check browser console (F12)
2. Look for API URL in logs
3. Should say: `[API] Using API URL: https://your-domain/api`
4. Not `http://localhost:5005`
5. If wrong, environment variables didn't load
6. Go back to Settings → Environment Variables
7. Verify all 6 are there
8. Redeploy

### Page Shows "Cannot Connect to Database"
**What to do:**
1. Check SUPABASE_URL is correct
2. Check SUPABASE_ANON_KEY is correct
3. Verify Supabase project is active
4. Go to https://supabase.com/dashboard
5. Make sure your project shows "Active"
6. If not, click project and check status

---

## 📞 Support Information

### GitHub Repository
Your code: https://github.com/adit-panchal/Verity_The_Chatbot

### Latest Commit
```
f694884 - Add Vercel configuration and deployment fix guide
```

### Project Files
- `vercel.json` - Deployment configuration ✓
- `VERCEL_DEPLOYMENT_FIX.md` - Full deployment guide ✓
- `backend/.env.example` - Environment template ✓
- All code pushed and ready ✓

---

## ✨ Success Indicators

When everything is working:

✓ Deployment shows **Ready** status
✓ URL is live and accessible
✓ Login page loads
✓ Can log in with test credentials
✓ Admin panel accessible
✓ No 404 errors
✓ Console shows no API errors

---

## 🎯 Expected URLs After Deployment

**Live Application:**
```
https://your-project-name.vercel.app
```

**Login Page:**
```
https://your-project-name.vercel.app/login
```

**Admin Panel:**
```
https://your-project-name.vercel.app/admin
```

**API Endpoint:**
```
https://your-project-name.vercel.app/api/auth/login
```

---

## Quick Reference: What Each Variable Does

| Variable | Purpose | Example |
|----------|---------|---------|
| SUPABASE_URL | Database location | https://xxx.supabase.co |
| SUPABASE_ANON_KEY | Public API access | eyJhbGc... |
| SUPABASE_SERVICE_ROLE_KEY | Backend database access | eyJpc3M... |
| JWT_SECRET | Token signing key | Random string |
| GROQ_API_KEY | AI API access | gsk_xxx |
| NODE_ENV | Environment | production |

---

## ⏱️ Time Estimate

- Add environment variables: **5 minutes**
- Trigger deployment: **1 minute**
- Build & deployment: **3-5 minutes**
- Testing: **2 minutes**

**Total: ~15 minutes**

---

## Next Steps After Deployment

1. ✅ Test login in production
2. ✅ Verify admin panel works
3. ✅ Check all API endpoints
4. ✅ Monitor error logs
5. ✅ Optional: Set up error tracking (Sentry)
6. ✅ Optional: Set up analytics
7. ✅ Share URL with users

---

## Auto-Deployment from Now On

Once deployed:

**Automatic deployments happen when:**
1. You push code to `main` branch
2. GitHub notifies Vercel
3. Vercel automatically builds and deploys
4. Usually live within 2-3 minutes

**No manual action needed after first setup!**

---

**Status: Ready to Deploy** 🚀

Complete the steps above and your app will be live on Vercel!

Questions? See **VERCEL_DEPLOYMENT_FIX.md** for detailed troubleshooting.
