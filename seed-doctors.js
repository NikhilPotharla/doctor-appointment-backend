const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDoctors() {
  try {
    console.log('Starting to seed doctors...');

    // Create sample users with doctor role
    const users = [
      {
        email: 'dr.john.smith@example.com',
        password: 'password123',
        role: 'DOCTOR',
        profile: {
          firstName: 'John',
          lastName: 'Smith',
          gender: 'Male',
          city: 'New York',
          state: 'NY',
          country: 'USA'
        }
      },
      {
        email: 'dr.sarah.jones@example.com',
        password: 'password123',
        role: 'DOCTOR',
        profile: {
          firstName: 'Sarah',
          lastName: 'Jones',
          gender: 'Female',
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA'
        }
      },
      {
        email: 'dr.michael.brown@example.com',
        password: 'password123',
        role: 'DOCTOR',
        profile: {
          firstName: 'Michael',
          lastName: 'Brown',
          gender: 'Male',
          city: 'Chicago',
          state: 'IL',
          country: 'USA'
        }
      }
    ];

    const createdUsers = [];
    
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash: hashedPassword,
          role: userData.role,
          isVerified: true,
          isActive: true,
          profile: {
            create: userData.profile
          }
        },
        include: {
          profile: true
        }
      });
      
      createdUsers.push(user);
      console.log(`Created user: ${user.email}`);
    }

    // Create doctor profiles
    const doctors = [
      {
        userId: createdUsers[0].id,
        specializationId: 'cardiology',
        qualification: ['MD', 'FACC'],
        experienceYears: 15,
        licenseNumber: 'MD123456',
        consultationFee: 250.00,
        averageRating: 4.8,
        totalReviews: 127,
        about: 'Dr. John Smith is a board-certified cardiologist with over 15 years of experience in treating heart diseases and cardiovascular conditions.',
        isAvailable: true,
        verificationStatus: 'verified',
        clinics: {
          create: {
            name: 'Heart Care Center',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            phone: '+1234567890',
            isPrimary: true
          }
        }
      },
      {
        userId: createdUsers[1].id,
        specializationId: 'dermatology',
        qualification: ['MD', 'FAAD'],
        experienceYears: 12,
        licenseNumber: 'MD789012',
        consultationFee: 200.00,
        averageRating: 4.9,
        totalReviews: 89,
        about: 'Dr. Sarah Jones specializes in medical and cosmetic dermatology, providing comprehensive skin care solutions.',
        isAvailable: true,
        verificationStatus: 'verified',
        clinics: {
          create: {
            name: 'Skin Wellness Clinic',
            address: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            phone: '+1234567891',
            isPrimary: true
          }
        }
      },
      {
        userId: createdUsers[2].id,
        specializationId: 'neurology',
        qualification: ['MD', 'FAAN'],
        experienceYears: 18,
        licenseNumber: 'MD345678',
        consultationFee: 300.00,
        averageRating: 4.7,
        totalReviews: 156,
        about: 'Dr. Michael Brown is an expert neurologist specializing in treating disorders of the brain and nervous system.',
        isAvailable: true,
        verificationStatus: 'verified',
        clinics: {
          create: {
            name: 'Neurology Associates',
            address: '789 Pine Rd',
            city: 'Chicago',
            state: 'IL',
            phone: '+1234567892',
            isPrimary: true
          }
        }
      }
    ];

    for (const doctorData of doctors) {
      const doctor = await prisma.doctor.create({
        data: doctorData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: true
            }
          },
          clinics: true
        }
      });
      
      console.log(`Created doctor: ${doctor.user.profile.firstName} ${doctor.user.profile.lastName}`);
    }

    // Create some availability slots for each doctor
    const availabilitySlots = [
      // Dr. John Smith (Cardiology)
      { doctorId: 1, dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
      { doctorId: 1, dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
      { doctorId: 1, dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
      { doctorId: 1, dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
      { doctorId: 1, dayOfWeek: 5, startTime: '09:00', endTime: '17:00' }, // Friday
      
      // Dr. Sarah Jones (Dermatology)
      { doctorId: 2, dayOfWeek: 1, startTime: '08:00', endTime: '16:00' }, // Monday
      { doctorId: 2, dayOfWeek: 2, startTime: '08:00', endTime: '16:00' }, // Tuesday
      { doctorId: 2, dayOfWeek: 3, startTime: '08:00', endTime: '16:00' }, // Wednesday
      { doctorId: 2, dayOfWeek: 4, startTime: '08:00', endTime: '16:00' }, // Thursday
      { doctorId: 2, dayOfWeek: 5, startTime: '08:00', endTime: '16:00' }, // Friday
      
      // Dr. Michael Brown (Neurology)
      { doctorId: 3, dayOfWeek: 1, startTime: '10:00', endTime: '18:00' }, // Monday
      { doctorId: 3, dayOfWeek: 2, startTime: '10:00', endTime: '18:00' }, // Tuesday
      { doctorId: 3, dayOfWeek: 3, startTime: '10:00', endTime: '18:00' }, // Wednesday
      { doctorId: 3, dayOfWeek: 4, startTime: '10:00', endTime: '18:00' }, // Thursday
      { doctorId: 3, dayOfWeek: 5, startTime: '10:00', endTime: '18:00' }, // Friday
    ];

    for (const slot of availabilitySlots) {
      await prisma.availabilitySlot.create({
        data: {
          doctorId: slot.doctorId,
          dayOfWeek: slot.dayOfWeek,
          startTime: new Date(`1970-01-01T${slot.startTime}`),
          endTime: new Date(`1970-01-01T${slot.endTime}`),
          isAvailable: true
        }
      });
    }

    console.log('Successfully seeded doctors and availability slots!');
    console.log('Created 3 doctors with profiles and clinics');
    
  } catch (error) {
    console.error('Error seeding doctors:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDoctors();
