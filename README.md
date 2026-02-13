# Doctor Appointment Backend API

Backend API for the Doctor Appointment Booking System built with Node.js, Express, and Prisma.

## 🚀 Features

- User authentication (JWT)
- Role-based access control (Patient, Doctor, Admin)
- Appointment booking and management
- Doctor profiles and availability
- Medical records management
- Payment integration
- Real-time notifications
- Email and SMS notifications

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT
- **Validation:** Express Validator
- **File Upload:** Multer
- **Email:** Nodemailer

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/doctor_appointment"
JWT_SECRET="your-secret-key"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

## 📝 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## 📁 Project Structure

```
doctor-appointment-backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── config/          # Configuration files
│   └── server.js        # Entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── .env                 # Environment variables
├── .gitignore
└── package.json
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Doctors
- `GET /api/doctors` - Get all doctors (with filters)
- `GET /api/doctors/:id` - Get doctor by ID
- `PUT /api/doctors/:id` - Update doctor profile
- `POST /api/doctors/availability` - Set availability

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Payments
- `POST /api/payments/create` - Create payment
- `GET /api/payments/verify` - Verify payment

## 🗄 Database Schema

The database includes the following main tables:
- Users (patients, doctors, admins)
- Profiles
- Doctors
- Clinics
- Appointments
- Medical Records
- Payments
- Reviews
- Availability Slots
- Notifications

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

ISC
