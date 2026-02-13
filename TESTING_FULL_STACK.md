# 🧪 Complete Frontend + Backend Testing Guide

## 🚀 Setup & Start Both Servers

### Step 1: Start Backend Server

```bash
# Terminal 1 - Backend
cd doctor-appointment-backend
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 5000
📝 Environment: development
🌐 API URL: http://localhost:5000
```

**Verify Backend:**
- Open browser: http://localhost:5000/health
- Should see: `{"status":"OK","timestamp":"..."}`

---

### Step 2: Start Frontend Server

```bash
# Terminal 2 - Frontend
cd your-frontend-folder
npm start
# OR for Vite
npm run dev
```

**Expected Output:**
```
Local: http://localhost:3000
# OR for Vite
Local: http://localhost:5173
```

---

## ✅ Test Scenario 1: Patient Registration & Login

### 1.1 Register a New Patient

1. **Open Frontend:** http://localhost:3000 (or 5173)
2. **Navigate to:** Register page
3. **Select:** "I'm a Patient"
4. **Fill in the form:**
   ```
   First Name: John
   Last Name: Doe
   Email: john.patient@test.com
   Phone: +1234567890
   Password: Patient123
   Confirm Password: Patient123
   ✓ Accept Terms
   ```
5. **Click:** "Create Account"

**Expected Result:**
- ✅ Success message: "Registration successful! Redirecting to login..."
- ✅ Redirects to login page after 2 seconds
- ✅ Check browser DevTools → Application → Local Storage:
  - `token`: Should contain JWT token
  - `user`: Should contain user object

**Backend Verification:**
- Check terminal logs for: `POST /api/auth/register 201`
- Open Prisma Studio: `npm run prisma:studio`
- Navigate to `User` table → Should see new user with email `john.patient@test.com`

---

### 1.2 Login as Patient

1. **On Login Page**
2. **Enter credentials:**
   ```
   Email: john.patient@test.com
   Password: Patient123
   ```
3. **Click:** "Sign In"

**Expected Result:**
- ✅ Success! Redirects to `/patient/dashboard`
- ✅ Token saved in localStorage
- ✅ User object saved in localStorage
- ✅ Redux state updated (check Redux DevTools)

**Backend Verification:**
- Terminal logs: `POST /api/auth/login 200`

---

## ✅ Test Scenario 2: Doctor Registration & Login

### 2.1 Register a New Doctor

1. **Navigate to:** Register page
2. **Select:** "I'm a Doctor"
3. **Fill in the form:**
   ```
   First Name: Sarah
   Last Name: Smith
   Email: sarah.doctor@test.com
   Phone: +1987654321
   Specialization: Cardiologist
   License Number: MED123456
   Years of Experience: 10
   Password: Doctor123
   Confirm Password: Doctor123
   ✓ Accept Terms
   ```
4. **Click:** "Create Account"

**Expected Result:**
- ✅ Success message appears
- ✅ Redirects to login page
- ✅ Token saved in localStorage

**Backend Verification:**
- Terminal logs:
  - `POST /api/auth/register 201` (User created)
  - `POST /api/doctors/register 201` (Doctor profile created)
- Prisma Studio:
  - `User` table → New doctor user
  - `Doctor` table → New doctor profile with `verificationStatus: "pending"`

---

### 2.2 Login as Doctor

1. **On Login Page**
2. **Enter credentials:**
   ```
   Email: sarah.doctor@test.com
   Password: Doctor123
   ```
3. **Click:** "Sign In"

**Expected Result:**
- ✅ Redirects to `/doctor/dashboard`
- ✅ User object includes `doctor` property
- ✅ Role is "DOCTOR"

**Backend Verification:**
- Terminal logs: `POST /api/auth/login 200`
- Response includes doctor profile data

---

## 🔍 Test Scenario 3: Protected Routes

### 3.1 Test Authentication Guard

1. **Logout** (if logged in)
2. **Try to access:** `/patient/dashboard` directly
3. **Expected:** Redirect to `/login`

### 3.2 Test Role-Based Access

1. **Login as Patient**
2. **Try to access:** `/doctor/dashboard`
3. **Expected:** Access denied or redirect

---

## 🧪 Test Scenario 4: API Integration Tests

### 4.1 Get Current User

**Frontend Action:**
- After login, the app should automatically fetch current user

**Backend Endpoint:**
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john.patient@test.com",
    "role": "PATIENT",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

---

### 4.2 Update Profile (If implemented in frontend)

**Frontend Action:**
- Navigate to profile page
- Update first name to "Johnny"
- Save

**Backend Endpoint:**
```
PUT /api/users/profile
Headers: Authorization: Bearer <token>
Body: { "firstName": "Johnny" }
```

**Expected:**
- ✅ Profile updated in database
- ✅ UI reflects changes
- ✅ localStorage user object updated

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error

**Error in Browser Console:**
```
Access to XMLHttpRequest at 'http://localhost:5000/api/auth/login' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
1. Check backend `.env` file:
   ```env
   FRONTEND_URL="http://localhost:3000"
   ```
2. If using Vite (port 5173), update to:
   ```env
   FRONTEND_URL="http://localhost:5173"
   ```
3. Restart backend server

---

### Issue 2: 401 Unauthorized

**Error:** "No token provided" or "Invalid token"

**Solution:**
1. Check localStorage for token:
   ```javascript
   console.log(localStorage.getItem('token'));
   ```
2. Verify token is being sent in headers:
   ```javascript
   // In api.js interceptor
   config.headers.Authorization = `Bearer ${token}`;
   ```
3. Check token expiration (default 7 days)

---

### Issue 3: Registration Success but No Redirect

**Problem:** User registered but stuck on registration page

**Solution:**
1. Check browser console for errors
2. Verify `navigate('/login')` is being called
3. Check if React Router is properly configured

---

### Issue 4: Role Mismatch in Redirect

**Problem:** Doctor redirects to patient dashboard

**Solution:**
```javascript
// In Login.jsx, ensure role is converted to lowercase
const role = response.user.role.toLowerCase();
navigate(`/${role}/dashboard`);
```

---

## 📊 Testing Checklist

### Backend Tests
- [ ] Server starts on port 5000
- [ ] Health endpoint responds: `/health`
- [ ] Database connected (check Prisma Studio)
- [ ] All migrations applied

### Frontend Tests
- [ ] Frontend starts successfully
- [ ] Can access login page
- [ ] Can access register page
- [ ] Forms validate correctly

### Integration Tests
- [ ] Patient registration works
- [ ] Patient login works
- [ ] Patient redirects to `/patient/dashboard`
- [ ] Doctor registration works (2-step process)
- [ ] Doctor login works
- [ ] Doctor redirects to `/doctor/dashboard`
- [ ] Token saved in localStorage
- [ ] User object saved in localStorage
- [ ] Protected routes require authentication
- [ ] Logout clears localStorage
- [ ] API calls include Authorization header

---

## 🔧 Debug Tools

### 1. Browser DevTools

**Console Tab:**
- Check for JavaScript errors
- View API request/response logs

**Network Tab:**
- Monitor API calls
- Check request headers (Authorization)
- View response status codes
- Inspect response data

**Application Tab:**
- Local Storage → Check `token` and `user`
- Cookies (if using)

### 2. Redux DevTools (If installed)

- View current auth state
- Track action dispatches
- Time-travel debugging

### 3. Backend Terminal

- Monitor API requests
- Check for errors
- View request logs

### 4. Prisma Studio

```bash
npm run prisma:studio
```
- View database tables
- Check user records
- Verify doctor profiles
- Monitor data changes

---

## 📝 Test Data

### Patient Accounts
```
Email: john.patient@test.com
Password: Patient123

Email: jane.patient@test.com
Password: Patient123
```

### Doctor Accounts
```
Email: sarah.doctor@test.com
Password: Doctor123
License: MED123456

Email: mike.doctor@test.com
Password: Doctor123
License: MED789012
```

---

## 🎯 Advanced Testing

### Test with Postman (Parallel Testing)

While frontend is running, test same APIs with Postman:

1. **Register Patient via Postman**
   - POST `http://localhost:5000/api/auth/register`
   - Body: Patient data
   - Save token

2. **Login via Frontend**
   - Use same credentials
   - Should work seamlessly

3. **Verify Data Consistency**
   - Check Prisma Studio
   - Both registrations should appear

---

## ✅ Success Criteria

Your integration is successful when:

1. ✅ Both servers run without errors
2. ✅ Patient can register and login
3. ✅ Doctor can register (2-step) and login
4. ✅ Correct role-based redirects work
5. ✅ Tokens are saved and used correctly
6. ✅ Protected routes require authentication
7. ✅ No CORS errors
8. ✅ Data persists in database
9. ✅ Logout clears session properly
10. ✅ API responses match expected format

---

## 🚀 Next Steps After Successful Testing

1. **Implement More Features:**
   - Doctor listing page
   - Appointment booking
   - Profile management
   - Medical records

2. **Add Error Handling:**
   - Network errors
   - Token expiration
   - Form validation errors

3. **Improve UX:**
   - Loading states
   - Success notifications
   - Error messages

4. **Security Enhancements:**
   - Token refresh
   - Rate limiting
   - Input sanitization

5. **Deploy:**
   - Backend to Railway/Render
   - Frontend to Vercel/Netlify
   - Update API URLs

---

## 📞 Quick Reference

**Backend URL:** http://localhost:5000
**Frontend URL:** http://localhost:3000 (or 5173)
**Prisma Studio:** http://localhost:5555

**Key Files:**
- Backend: `src/server.js`
- Frontend: `src/services/authService.js`
- Redux: `src/redux/slices/authSlice.js`

---

## 🎉 You're Ready!

Both your frontend and backend are now integrated and ready for testing. Follow the scenarios above to verify everything works correctly!

**Happy Testing! 🚀**
