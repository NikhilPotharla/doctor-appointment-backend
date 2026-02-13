# Postman Testing Guide - Authentication APIs

## 🚀 Quick Setup

### Step 1: Open Postman
If you don't have Postman, download it from [postman.com](https://www.postman.com/downloads/)

### Step 2: Create a New Collection
1. Click "New" → "Collection"
2. Name it: "Doctor Appointment API"
3. Save

---

## 📋 Test Scenarios

### Scenario 1: Patient Registration and Login

#### 1.1 Register a Patient

**Request:**
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/register`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "patient@example.com",
  "password": "Patient123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PATIENT",
  "phone": "+1234567890"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "patient@example.com",
      "role": "PATIENT",
      "profile": {
        "id": "uuid-here",
        "userId": "uuid-here",
        "firstName": "John",
        "lastName": "Doe",
        "dateOfBirth": null,
        "gender": null,
        "bloodGroup": null,
        "profilePicture": null,
        "address": null,
        "city": null,
        "state": null,
        "country": null,
        "postalCode": null
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**📝 Note:** Copy the `token` value - you'll need it for protected endpoints!

---

#### 1.2 Login as Patient

**Request:**
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/login`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "patient@example.com",
  "password": "Patient123"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "patient@example.com",
      "role": "PATIENT",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2026-02-13T...",
      "updatedAt": "2026-02-13T...",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "doctor": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 1.3 Get Current Patient Profile (Protected)

**Request:**
- **Method:** GET
- **URL:** `http://localhost:5000/api/auth/me`
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN_HERE`
  - (Replace `YOUR_TOKEN_HERE` with the token from login)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "uuid-here",
    "email": "patient@example.com",
    "role": "PATIENT",
    "isVerified": false,
    "isActive": true,
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "doctor": null
  }
}
```

---

### Scenario 2: Doctor Registration and Login

#### 2.1 Register a Doctor (User Account)

**Request:**
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/register`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "doctor@example.com",
  "password": "Doctor123",
  "firstName": "Sarah",
  "lastName": "Smith",
  "role": "DOCTOR",
  "phone": "+1987654321"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "doctor@example.com",
      "role": "DOCTOR",
      "profile": {
        "firstName": "Sarah",
        "lastName": "Smith"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**📝 Note:** Save this token! You'll need it for the next step.

---

#### 2.2 Create Doctor Profile (Protected - DOCTOR role)

**Request:**
- **Method:** POST
- **URL:** `http://localhost:5000/api/doctors/register`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_DOCTOR_TOKEN_HERE`
- **Body (raw JSON):**
```json
{
  "specializationId": "00000000-0000-0000-0000-000000000001",
  "qualification": ["MBBS", "MD - Cardiology"],
  "experienceYears": 10,
  "licenseNumber": "MED123456",
  "consultationFee": 500,
  "about": "Experienced cardiologist with 10 years of practice in treating heart conditions."
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Doctor profile created successfully. Pending admin verification.",
  "data": {
    "id": "uuid-here",
    "userId": "uuid-here",
    "specializationId": "00000000-0000-0000-0000-000000000001",
    "qualification": ["MBBS", "MD - Cardiology"],
    "experienceYears": 10,
    "licenseNumber": "MED123456",
    "consultationFee": "500.00",
    "averageRating": "0.00",
    "totalReviews": 0,
    "about": "Experienced cardiologist...",
    "isAvailable": false,
    "verificationStatus": "pending",
    "user": {
      "id": "uuid-here",
      "email": "doctor@example.com",
      "profile": {
        "firstName": "Sarah",
        "lastName": "Smith"
      }
    }
  }
}
```

---

#### 2.3 Login as Doctor

**Request:**
- **Method:** POST
- **URL:** `http://localhost:5000/api/auth/login`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "doctor@example.com",
  "password": "Doctor123"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "doctor@example.com",
      "role": "DOCTOR",
      "isVerified": false,
      "isActive": true,
      "profile": {
        "firstName": "Sarah",
        "lastName": "Smith"
      },
      "doctor": {
        "id": "uuid-here",
        "specializationId": "00000000-0000-0000-0000-000000000001",
        "qualification": ["MBBS", "MD - Cardiology"],
        "experienceYears": 10,
        "licenseNumber": "MED123456",
        "consultationFee": "500.00",
        "verificationStatus": "pending",
        "isAvailable": false
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 🎯 Complete Test Flow

### Test Order:
1. ✅ Register Patient
2. ✅ Login Patient
3. ✅ Get Patient Profile
4. ✅ Register Doctor (user account)
5. ✅ Create Doctor Profile
6. ✅ Login Doctor
7. ✅ Get Doctor Profile

---

## 🔧 Postman Tips

### Setting Up Environment Variables

1. **Create Environment:**
   - Click "Environments" → "Create Environment"
   - Name: "Local Development"

2. **Add Variables:**
   ```
   base_url = http://localhost:5000/api
   patient_token = (leave empty, will be set after login)
   doctor_token = (leave empty, will be set after login)
   ```

3. **Use Variables in Requests:**
   - URL: `{{base_url}}/auth/login`
   - Authorization: `Bearer {{patient_token}}`

### Auto-Save Tokens (Using Tests Tab)

In the **Tests** tab of your login request, add:

```javascript
// For Patient Login
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("patient_token", jsonData.data.token);
    console.log("Patient token saved!");
}

// For Doctor Login
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("doctor_token", jsonData.data.token);
    console.log("Doctor token saved!");
}
```

---

## ❌ Common Errors and Solutions

### Error 1: "Email already registered"
**Solution:** Use a different email or delete the user from database

### Error 2: "Invalid email or password"
**Solution:** Check email and password are correct

### Error 3: "No token provided"
**Solution:** Add `Authorization: Bearer YOUR_TOKEN` header

### Error 4: "Insufficient permissions"
**Solution:** Make sure you're using the correct role token (patient vs doctor)

### Error 5: "License number already registered"
**Solution:** Use a different license number for doctor registration

---

## 📊 Expected Status Codes

- `200` - Success (GET, PUT requests)
- `201` - Created (POST requests)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🎨 Postman Collection JSON

Save this as a file and import into Postman:

```json
{
  "info": {
    "name": "Doctor Appointment API - Auth Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Register Patient",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"patient@example.com\",\n  \"password\": \"Patient123\",\n  \"firstName\": \"John\",\n  \"lastName\": \"Doe\",\n  \"role\": \"PATIENT\",\n  \"phone\": \"+1234567890\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/auth/register",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "auth", "register"]
        }
      }
    },
    {
      "name": "2. Login Patient",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"patient@example.com\",\n  \"password\": \"Patient123\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/auth/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "auth", "login"]
        }
      }
    },
    {
      "name": "3. Get Patient Profile",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer YOUR_PATIENT_TOKEN_HERE"
          }
        ],
        "url": {
          "raw": "http://localhost:5000/api/auth/me",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "auth", "me"]
        }
      }
    },
    {
      "name": "4. Register Doctor",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"doctor@example.com\",\n  \"password\": \"Doctor123\",\n  \"firstName\": \"Sarah\",\n  \"lastName\": \"Smith\",\n  \"role\": \"DOCTOR\",\n  \"phone\": \"+1987654321\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/auth/register",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "auth", "register"]
        }
      }
    },
    {
      "name": "5. Create Doctor Profile",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer YOUR_DOCTOR_TOKEN_HERE"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"specializationId\": \"00000000-0000-0000-0000-000000000001\",\n  \"qualification\": [\"MBBS\", \"MD - Cardiology\"],\n  \"experienceYears\": 10,\n  \"licenseNumber\": \"MED123456\",\n  \"consultationFee\": 500,\n  \"about\": \"Experienced cardiologist with 10 years of practice.\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/doctors/register",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "doctors", "register"]
        }
      }
    },
    {
      "name": "6. Login Doctor",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"doctor@example.com\",\n  \"password\": \"Doctor123\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/auth/login",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "auth", "login"]
        }
      }
    }
  ]
}
```

---

## ✅ Success Checklist

After completing all tests, you should have:
- [ ] Successfully registered a patient
- [ ] Successfully logged in as patient
- [ ] Retrieved patient profile with token
- [ ] Successfully registered a doctor user account
- [ ] Successfully created doctor profile
- [ ] Successfully logged in as doctor
- [ ] Retrieved doctor profile with token

---

## 🚀 Next Steps

Once authentication is working:
1. Test appointment booking
2. Test medical records
3. Test reviews and ratings
4. Test admin endpoints

See `API_DOCUMENTATION.md` for all available endpoints!
