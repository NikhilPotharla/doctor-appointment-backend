const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSpecializations() {
  try {
    console.log('Finding doctors with invalid specialization IDs...');

    // Find doctors with UUID specialization IDs
    const doctorsWithInvalidSpec = await prisma.doctor.findMany({
      where: {
        specializationId: {
          startsWith: '00000000-0000-0000-0000-000000000001'
        }
      },
      include: {
        user: {
          select: {
            profile: true
          }
        }
      }
    });

    if (doctorsWithInvalidSpec.length === 0) {
      console.log('No doctors with invalid specialization IDs found.');
      return;
    }

    console.log(`Found ${doctorsWithInvalidSpec.length} doctors with invalid specialization IDs. Fixing them...`);

    // Assign proper specializations
    const specializations = ['cardiology', 'dermatology', 'neurology', 'orthopedics', 'pediatrics', 'psychiatry'];
    
    for (let i = 0; i < doctorsWithInvalidSpec.length; i++) {
      const doctor = doctorsWithInvalidSpec[i];
      const newSpecialization = specializations[i % specializations.length];
      
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: {
          specializationId: newSpecialization
        }
      });

      console.log(`✅ Fixed: Dr. ${doctor.user.profile.firstName} ${doctor.user.profile.lastName} - Now: ${newSpecialization}`);
    }

    console.log('Successfully fixed all specializations!');

  } catch (error) {
    console.error('Error fixing specializations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecializations();
