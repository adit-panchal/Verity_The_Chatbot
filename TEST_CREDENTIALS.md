# ChatBot Application - Test Credentials

## Server Status
✅ **Backend Server**: Running on `http://localhost:5005`
✅ **Frontend Server**: Running on `http://localhost:5175`
✅ **MongoDB**: Connected to `mongodb://127.0.0.1:27017/chatbot`

---

## Test User Credentials

### 1. Normal User (Regular Permissions)
- **Email**: `user@test.com`
- **Password**: `password123`
- **Role**: User
- **Subscription**: Free
- **Access**: Regular chat features

### 2. Admin User (Full Permissions)
- **Email**: `admin@test.com`
- **Password**: `admin123`
- **Role**: Admin
- **Subscription**: Enterprise
- **Access**: Admin panel, user management, analytics

---

## How to Use

### 1. Access the Application
- Open your browser and go to: **http://localhost:5175**

### 2. Login with Test Credentials
Choose either test account above and enter the credentials on the login page.

### 3. Test Different Roles

**For Normal User:**
- Login with `user@test.com` / `password123`
- You'll be redirected to the main chat interface
- You can access all user features

**For Admin:**
- Login with `admin@test.com` / `admin123`
- You'll be redirected to the admin panel
- You can manage users, view analytics, and access admin features

---

## API Endpoints (Direct Testing)

### Test Login Endpoint
```bash
POST http://localhost:5005/api/auth/login

Request Body:
{
  "email": "user@test.com",
  "password": "password123"
}

Response:
{
  "_id": "6aa2481b00c452e83b4251e5",
  "name": "Test User",
  "email": "user@test.com",
  "role": "user",
  "subscription": "free",
  "workType": "Engineering",
  "nickname": "",
  "notifications": true,
  "preferences": "",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Troubleshooting

### If Login Shows 404 Error

1. **Check Backend is Running**
   ```powershell
   # Verify port 5005 is accessible
   Test-NetConnection localhost -Port 5005
   ```

2. **Check MongoDB Connection**
   ```powershell
   # Verify MongoDB is running
   Get-Process mongod
   ```

3. **Verify Frontend Proxy Settings**
   - Frontend is configured to proxy `/api` requests to `http://localhost:5005`
   - Check `frontend/vite.config.js` for proxy configuration

4. **Clear Browser Cache**
   - Clear sessionStorage and localStorage in browser DevTools
   - Try incognito mode

### If API Returns Different Error
- Check browser console for actual error message
- Check backend console for server logs
- Verify `.env` file is properly configured

---

## Creating Additional Test Users

To create more test users, run:
```powershell
cd backend
node scripts/create_test_users.js
```

To add custom users, edit `backend/scripts/create_test_users.js` and add more User objects.

---

## Important Notes

- All passwords are hashed using bcrypt before being stored in MongoDB
- Authentication uses JWT tokens that expire after 7 days
- Admin users have access to admin routes that require `role: "admin"`
- Regular users are redirected to the chat interface
- The application uses session storage to maintain user login state

---

**Last Updated**: September 10, 2026
**Application**: ChatBot with Admin Panel
