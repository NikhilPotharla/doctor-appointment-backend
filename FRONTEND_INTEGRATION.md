# Frontend-Backend Integration Guide

## 🔗 Backend API Configuration

Your backend is running at: **http://localhost:5000**

---

## 📝 Required Changes in Your Frontend

### 1. Update `authService.js`

Your `authService` needs to match the backend API structure. Here's the complete updated file:

```javascript
// src/services/authService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const authService = {
  // Register Patient
  registerPatient: async (userData) => {
    const response = await api.post('/register', {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: 'PATIENT', // Important: must be uppercase
    });
    
    // Save token if registration is successful
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  },

  // Register Doctor (Two-step process)
  registerDoctor: async (userData) => {
    // Step 1: Register user account with DOCTOR role
    const registerResponse = await api.post('/register', {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: 'DOCTOR', // Important: must be uppercase
    });

    if (registerResponse.data.success && registerResponse.data.data.token) {
      const token = registerResponse.data.data.token;
      localStorage.setItem('token', token);

      // Step 2: Create doctor profile
      try {
        const doctorResponse = await axios.post(
          'http://localhost:5000/api/doctors/register',
          {
            specializationId: '00000000-0000-0000-0000-000000000001', // Default specialization
            qualification: ['MBBS', userData.specialization || 'General Medicine'],
            experienceYears: userData.experienceYears || 0,
            licenseNumber: userData.licenseNumber,
            consultationFee: 500, // Default fee
            about: `${userData.specialization || 'General'} practitioner with ${userData.experienceYears || 0} years of experience`,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        localStorage.setItem('user', JSON.stringify(doctorResponse.data.data.user));
        return doctorResponse.data;
      } catch (error) {
        console.error('Doctor profile creation failed:', error);
        // Still return the user registration success
        return registerResponse.data;
      }
    }

    return registerResponse.data;
  },

  // Login (works for both patients and doctors)
  login: async (credentials) => {
    const response = await api.post('/login', {
      email: credentials.email,
      password: credentials.password,
    });

    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data.data; // Return { user, token }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/me');
    return response.data.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.post('/verify-email', { token });
    return response.data;
  },
};

export default authService;
```

---

### 2. Update Redux `authSlice.js`

Make sure your Redux slice matches the backend response structure:

```javascript
// src/redux/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
```

---

### 3. Update `Login.jsx`

Your login component is almost perfect! Just ensure the role-based redirect works:

```javascript
// In handleSubmit function, update the redirect logic:
const handleSubmit = async (e) => {
  e.preventDefault();
  const newErrors = validate();

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setLoading(true);
  dispatch(loginStart());

  try {
    const response = await authService.login(formData);
    dispatch(loginSuccess(response));

    // Redirect based on role (backend returns uppercase roles)
    const role = response.user.role.toLowerCase(); // Convert to lowercase for route
    
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'doctor') {
      navigate('/doctor/dashboard');
    } else {
      navigate('/patient/dashboard');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
    dispatch(loginFailure(errorMessage));
    setErrors({ general: errorMessage });
  } finally {
    setLoading(false);
  }
};
```

---

### 4. Update `Register.jsx`

Your register component needs minor updates:

```javascript
// Update the handleSubmit function:
const handleSubmit = async (e) => {
  e.preventDefault();
  const newErrors = validate();

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setLoading(true);

  try {
    const registrationData = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    };

    if (userType === 'doctor') {
      registrationData.specialization = formData.specialization;
      registrationData.licenseNumber = formData.licenseNumber;
      registrationData.experienceYears = parseInt(formData.experience);
      await authService.registerDoctor(registrationData);
    } else {
      await authService.registerPatient(registrationData);
    }

    setSuccess(true);
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
    setErrors({ general: errorMessage });
  } finally {
    setLoading(false);
  }
};
```

---

### 5. Create API Configuration File (Optional but Recommended)

Create a centralized API config:

```javascript
// src/config/api.js
export const API_BASE_URL = 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  // Users
  USERS: {
    PROFILE: '/users/profile',
    PROFILE_PICTURE: '/users/profile/picture',
  },
  // Doctors
  DOCTORS: {
    LIST: '/doctors',
    REGISTER: '/doctors/register',
    PROFILE: '/doctors/profile',
    CLINIC: '/doctors/clinic',
    AVAILABILITY: '/doctors/availability',
  },
  // Appointments
  APPOINTMENTS: {
    LIST: '/appointments',
    BOOK: '/appointments',
    SLOTS: '/appointments/slots',
    CANCEL: (id) => `/appointments/${id}/cancel`,
    STATUS: (id) => `/appointments/${id}/status`,
  },
};
```

---

## 🔧 Environment Variables

Create a `.env` file in your frontend root:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_BACKEND_URL=http://localhost:5000
```

Then update your API URL:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

---

## 🚀 Backend Response Structure

### Registration Response:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "PATIENT", // or "DOCTOR"
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "token": "jwt-token-here"
  }
}
```

### Login Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "PATIENT",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "doctor": null // or doctor object if role is DOCTOR
    },
    "token": "jwt-token-here"
  }
}
```

---

## ✅ Testing Checklist

1. **Start Backend:**
   ```bash
   cd doctor-appointment-backend
   npm run dev
   ```
   Backend should be running on http://localhost:5000

2. **Start Frontend:**
   ```bash
   cd your-frontend-folder
   npm start
   ```
   Frontend should be running on http://localhost:3000 (or 5173 for Vite)

3. **Test Patient Registration:**
   - Fill in patient form
   - Submit
   - Check browser console for response
   - Verify token is saved in localStorage

4. **Test Patient Login:**
   - Use registered credentials
   - Check redirect to `/patient/dashboard`
   - Verify token in localStorage

5. **Test Doctor Registration:**
   - Fill in doctor form with specialization and license
   - Submit
   - Check if doctor profile is created
   - Login and verify redirect to `/doctor/dashboard`

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error
**Error:** "Access to XMLHttpRequest has been blocked by CORS policy"

**Solution:** Backend already has CORS configured for `http://localhost:5173`. If your frontend runs on a different port, update backend `.env`:
```env
FRONTEND_URL="http://localhost:3000"
```
And restart backend.

### Issue 2: 401 Unauthorized
**Error:** "No token provided" or "Invalid token"

**Solution:** 
- Check if token is saved in localStorage
- Verify Authorization header format: `Bearer YOUR_TOKEN`
- Check token expiration (default 7 days)

### Issue 3: Role Mismatch
**Error:** Redirect not working or "Insufficient permissions"

**Solution:**
- Backend returns roles in UPPERCASE: "PATIENT", "DOCTOR", "ADMIN"
- Convert to lowercase for routes: `role.toLowerCase()`

### Issue 4: Doctor Registration Fails
**Error:** "specializationId is required"

**Solution:** Use the default UUID in the code above or create specializations in your database first.

---

## 📊 API Testing with Frontend

### Test Flow:
1. ✅ Register as Patient → Login → Access Patient Dashboard
2. ✅ Register as Doctor → Login → Access Doctor Dashboard
3. ✅ Test protected routes with token
4. ✅ Test logout and token removal

---

## 🎯 Next Steps

After authentication works:
1. Create doctor listing page (GET `/api/doctors`)
2. Create appointment booking (POST `/api/appointments`)
3. Create profile management (GET/PUT `/api/users/profile`)
4. Add protected route guards
5. Implement token refresh logic

Your backend is ready with all 38 endpoints! 🚀
