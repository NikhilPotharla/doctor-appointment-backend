# Database Setup Guide

## Option 1: NeonDB (Recommended - Free Cloud PostgreSQL)

### Steps:
1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy the connection string
5. Update `.env` file:
   ```env
   DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
   ```

## Option 2: Supabase (Free Cloud PostgreSQL)

### Steps:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (Connection pooling recommended)
5. Update `.env` file with the connection string

## Option 3: Local PostgreSQL

### Windows:
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Install PostgreSQL
3. Open pgAdmin or command line
4. Create database:
   ```sql
   CREATE DATABASE doctor_appointment;
   ```
5. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/doctor_appointment"
   ```

## After Setting Up Database

### 1. Generate Prisma Client
```bash
npm run prisma:generate
```

### 2. Run Migrations
```bash
npm run prisma:migrate
```

When prompted for migration name, enter: `init`

### 3. Verify Database
```bash
npm run prisma:studio
```

This will open Prisma Studio in your browser where you can see all tables.

## Environment Variables

Make sure your `.env` file has all required variables:

```env
# Database
DATABASE_URL="your_database_connection_string"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# Frontend
FRONTEND_URL="http://localhost:5173"

# Email (Optional - for development, emails will be logged)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="Doctor Appointment <noreply@doctorappointment.com>"
```

## Test the Setup

### 1. Start the server
```bash
npm run dev
```

### 2. Test health endpoint
Open browser or use curl:
```bash
curl http://localhost:5000/health
```

You should see:
```json
{
  "status": "OK",
  "timestamp": "2024-02-13T..."
}
```

## Common Issues

### Issue: "Can't reach database server"
**Solution:** Check if your DATABASE_URL is correct and the database is running

### Issue: "Environment variable not found: DATABASE_URL"
**Solution:** Make sure `.env` file exists in the root directory

### Issue: "Migration failed"
**Solution:** 
1. Delete `prisma/migrations` folder
2. Run `npm run prisma:migrate` again

### Issue: "Prisma Client not found"
**Solution:** Run `npm run prisma:generate`

## Next Steps

After successful database setup:
1. ✅ Test API endpoints with Postman
2. ✅ Create test users and doctors
3. ✅ Test appointment booking flow
4. ✅ Integrate with frontend
