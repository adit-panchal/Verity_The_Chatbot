# Quick Commands Reference

## 🚀 Run Locally (Development)

### Terminal 1: Backend
```bash
cd backend
npm install
npm start
```
**Result:** Backend running on `http://localhost:5005`

### Terminal 2: Frontend  
```bash
cd frontend
npm install
npm run dev
```
**Result:** Frontend running on `http://localhost:5175`

---

## 🧪 Test Commands

### Test Normal User Login
```bash
curl -X POST http://localhost:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'
```

### Test Admin User Login
```bash
curl -X POST http://localhost:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

### Test Protected Route (with token)
```bash
curl -X GET http://localhost:5005/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Test Admin Stats (admin only)
```bash
curl -X GET http://localhost:5005/api/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

## 👥 User Management

### Create/Reset Test Users
```bash
cd backend
node scripts/create_supabase_users.js
```

### Check Database Connection
```bash
cd backend
node -e "
require('dotenv').config();
const supabase = require('./config/supabase');
supabase.from('users').select('count', { count: 'exact', head: true })
  .then(result => console.log('✓ Connected!', result))
  .catch(err => console.error('✗ Error:', err))
"
```

---

## 📦 Build & Deploy

### Build Frontend for Production
```bash
cd frontend
npm run build
```
**Result:** Production build in `frontend/dist/`

### Test Production Build Locally
```bash
cd frontend
npm run build
npm run preview
```

### Deploy to Vercel
```bash
git add .
git commit -m "Your commit message"
git push origin main
```
**Vercel will auto-deploy on push**

---

## 🔧 Troubleshooting

### Check If Backend is Running
```bash
curl http://localhost:5005/
```
**Expected:** "API is running..."

### Check If Frontend is Running
```bash
curl http://localhost:5175/
```
**Expected:** HTML response

### View Backend Logs
```bash
# While backend is running, check console output
# Look for lines starting with [Auth], [Database], [Server]
```

### Clear Dependencies & Reinstall
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Reset to Clean State
```bash
# Clean backend
cd backend
rm -rf node_modules .env
cp .env.example .env
npm install

# Clean frontend
cd frontend
rm -rf node_modules
npm install
```

---

## 🌐 Vercel Commands

### Deploy Preview
```bash
# Just push to git, Vercel handles everything
git push origin main
```

### Check Vercel Logs
```bash
# In Vercel Dashboard:
# 1. Go to your project
# 2. Click "Deployments"
# 3. Click latest deployment
# 4. Click "Functions" tab for backend logs
```

### Set Environment Variables in Vercel
```bash
# In Vercel Dashboard:
# 1. Settings → Environment Variables
# 2. Add: SUPABASE_URL
# 3. Add: SUPABASE_SERVICE_ROLE_KEY
# 4. Add: SUPABASE_ANON_KEY
# 5. Add: JWT_SECRET
# 6. Redeploy
```

---

## 📊 Database Operations

### View Supabase Data
```bash
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Click "SQL Editor" or "Tables"
# 4. Query users, chats, etc.
```

### Export User Data
```bash
curl -X GET http://localhost:5005/api/privacy/data/export \
  -H "Authorization: Bearer USER_TOKEN"
```

### Check User Count
```bash
curl -s http://localhost:5005/api/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN" | jq '.totalUsers'
```

---

## 📝 Configuration

### Update .env
```bash
# Copy template
cp backend/.env.example backend/.env

# Edit with your values
nano backend/.env  # Linux/Mac
# or
code backend\.env  # Windows with VS Code
```

### Frontend .env.local
```bash
# Create frontend/.env.local
echo "VITE_API_URL=http://localhost:5005" > frontend/.env.local

# For production
echo "VITE_API_URL=https://your-api.vercel.app" > frontend/.env.local
```

---

## 🔍 Monitoring

### Check Backend Health
```bash
# Every 5 seconds
watch -n 5 'curl -s http://localhost:5005/ || echo "Backend down"'
```

### Monitor Logs in Real-Time
```bash
# Terminal with backend running
# You'll see logs as they happen
```

### Check Node Version
```bash
node --version  # Should be 18+
npm --version   # Should be 8+
```

---

## 🧹 Cleanup

### Remove Old Test Data
```bash
# Recreate test users (cleans old ones first)
cd backend
node scripts/create_supabase_users.js
```

### Clear Browser Cache (Dev)
```javascript
// In browser console
sessionStorage.clear();
localStorage.clear();
location.reload();
```

### Clean Build Cache
```bash
# Frontend
cd frontend && rm -rf dist .vite

# Backend
cd backend && rm -rf .cache
```

---

## 📚 Documentation

### View All Guides
```bash
# Main guides
cat QUICKSTART.md           # Get started fast
cat DEPLOYMENT_GUIDE.md     # Deploy to Vercel
cat MIGRATION_SUMMARY.md    # Technical details
cat TEST_CREDENTIALS.md     # Test users
cat FINAL_REPORT.md        # Complete report
```

### Check File Structure
```bash
tree -L 2 -I node_modules
# or
ls -la backend/
ls -la frontend/
```

---

## 🚨 Emergency Commands

### Stop All Servers
```bash
# In each terminal where backend/frontend is running
# Press Ctrl+C
```

### Kill Process on Port 5005 (Backend)
```bash
# Linux/Mac
lsof -ti:5005 | xargs kill -9

# Windows
netstat -ano | findstr :5005
taskkill /PID <PID> /F
```

### Kill Process on Port 5175 (Frontend)
```bash
# Linux/Mac
lsof -ti:5175 | xargs kill -9

# Windows
netstat -ano | findstr :5175
taskkill /PID <PID> /F
```

---

## ✅ Verification Checklist

```bash
# 1. Check Node.js
node --version

# 2. Check NPM
npm --version

# 3. Check backend
cd backend && npm start
# (should see "Server running on port 5005")

# 4. Check database connection
curl http://localhost:5005/
# (should see "API is running...")

# 5. Test login
curl -X POST http://localhost:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'
# (should see JWT token in response)

# 6. Check frontend
cd frontend && npm run dev
# (should open http://localhost:5175)
```

---

## 💡 Pro Tips

1. **Always use separate terminals** for backend and frontend
2. **Check .env before running** - verify Supabase keys
3. **Use curl for API testing** - faster than Postman
4. **Monitor logs while testing** - catch errors early
5. **Restart backend after .env changes** - configuration reload
6. **Clear cache if frontend looks broken** - hard refresh (Ctrl+Shift+R)
7. **Save tokens for API testing** - use curl header tricks
8. **Use `jq` for JSON parsing** - pretty print API responses

---

## 🔗 Useful Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **JWT Decoder:** https://jwt.io/
- **Curl Examples:** https://curl.se/docs/manpage.html
- **Express.js Docs:** https://expressjs.com/

---

## 📞 Need Help?

1. Check **QUICKSTART.md** for fast start
2. Check **DEPLOYMENT_GUIDE.md** for deployment issues
3. Check **FINAL_REPORT.md** for troubleshooting
4. Look at logs in **Vercel Dashboard** for production errors

---

**Last Updated:** September 10, 2026
**Status:** Production Ready ✅
