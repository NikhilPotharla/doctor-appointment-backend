# API Endpoints Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PATIENT",  // or "DOCTOR"
  "phone": "+1234567890"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

## User Endpoints

### Get Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "Male",
  "bloodGroup": "O+",
  "city": "New York"
}
```

## Doctor Endpoints

### Get All Doctors (with filters)
```http
GET /doctors?specialization=cardiology&city=NewYork&minRating=4&page=1&limit=10
```

### Get Doctor by ID
```http
GET /doctors/:id
```

### Register as Doctor
```http
POST /doctors/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "specializationId": "uuid",
  "qualification": ["MBBS", "MD"],
  "experienceYears": 10,
  "licenseNumber": "LIC123456",
  "consultationFee": 500,
  "about": "Experienced cardiologist..."
}
```

### Add Clinic
```http
POST /doctors/clinic
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "City Hospital",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "phone": "+1234567890",
  "isPrimary": true
}
```

### Set Availability
```http
POST /doctors/availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "slots": [
    {
      "dayOfWeek": 1,  // Monday
      "startTime": "09:00",
      "endTime": "17:00",
      "isAvailable": true
    }
  ]
}
```

## Appointment Endpoints

### Get Available Slots
```http
GET /appointments/slots/:doctorId?date=2024-02-15
```

### Book Appointment
```http
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": "uuid",
  "appointmentDate": "2024-02-15",
  "startTime": "2024-02-15T10:00:00Z",
  "endTime": "2024-02-15T10:30:00Z",
  "type": "CLINIC",  // or "VIDEO", "HOME"
  "clinicId": "uuid",
  "symptoms": "Chest pain"
}
```

### Get Appointments
```http
GET /appointments?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

### Cancel Appointment
```http
PUT /appointments/:id/cancel
Authorization: Bearer <token>
```

### Update Appointment Status (Doctor only)
```http
PUT /appointments/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"  // or "completed", "cancelled"
}
```

## Medical Records Endpoints

### Create Medical Record (Doctor only)
```http
POST /medical-records
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "uuid",
  "appointmentId": "uuid",
  "diagnosis": "Hypertension",
  "prescription": ["Medicine A 10mg", "Medicine B 5mg"],
  "tests": ["Blood Test", "ECG"],
  "notes": "Follow-up in 2 weeks",
  "fileUrls": ["https://..."]
}
```

### Get Patient Medical Records
```http
GET /medical-records/patient/:patientId
Authorization: Bearer <token>
```

## Review Endpoints

### Submit Review (Patient only)
```http
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "appointmentId": "uuid",
  "rating": 5,
  "comment": "Excellent doctor!"
}
```

### Get Doctor Reviews
```http
GET /reviews/doctor/:doctorId?page=1&limit=10
```

## Admin Endpoints

### Get All Users
```http
GET /admin/users?role=DOCTOR&search=john&page=1&limit=20
Authorization: Bearer <token>
```

### Verify Doctor
```http
PUT /admin/doctors/:id/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "verified"  // or "rejected"
}
```

### Block/Unblock User
```http
PUT /admin/users/:id/block
Authorization: Bearer <token>
Content-Type: application/json

{
  "isActive": false
}
```

### Get Platform Statistics
```http
GET /admin/statistics
Authorization: Bearer <token>
```

### Get All Appointments (Admin view)
```http
GET /admin/appointments?status=completed&page=1&limit=20
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]  // Optional validation errors
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
