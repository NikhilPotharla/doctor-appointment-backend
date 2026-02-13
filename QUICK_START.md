# Quick Start Guide

## ✅ Prisma Setup Complete!

Prisma Client v6.19.2 has been successfully installed and generated.

## 🗄️ Database Setup (Choose One Option)

### Option 1: NeonDB (Recommended - 5 minutes)

1. **Go to [neon.tech](https://neon.tech)** and sign up (free)
2. **Create a new project**
3. **Copy the connection string** (looks like this):
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. **Update `.env` file** - Replace line 2 with your connection string:
   ```env
   DATABASE_URL="your-neon-connection-string-here"
   ```
5. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```
   When prompted for migration name, type: `init`

### Option 2: Supabase (Alternative - 5 minutes)

1. **Go to [supabase.com](https://supabase.com)** and sign up
2. **Create a new project**
3. **Go to Settings → Database**
4. **Copy the connection string** (use "Connection pooling" mode)
5. **Update `.env` file** with the connection string
6. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

### Option 3: Local PostgreSQL (If you have PostgreSQL installed)

1. **Create database**:
   ```sql
   CREATE DATABASE doctor_appointment;
   ```
2. **Update `.env` file**:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/doctor_appointment"
   ```
3. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

## 🚀 After Database Setup

### 1. Verify Database Connection
```bash
npm run prisma:studio
```
This opens a visual database browser.

### 2. Start the Server
```bash
npm run dev
```

### 3. Test the API
Open browser: `http://localhost:5000/health`

You should see:
```json
{
  "status": "OK",
  "timestamp": "2026-02-13T..."
}
```

## 📝 Test Your First API Call

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123456\",\"firstName\":\"John\",\"lastName\":\"Doe\"}"
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123456\"}"
```

## 🎯 You're Ready!

Once database is set up and migrations run, you can:
- ✅ Test all 38 API endpoints
- ✅ Integrate with frontend
- ✅ Start building additional features
- ✅ Deploy to production

See `API_DOCUMENTATION.md` for complete API reference.
