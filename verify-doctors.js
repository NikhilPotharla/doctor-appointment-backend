const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAllDoctors() {
  try {
    console.log('Finding all pending doctors...');

    // Find all doctors with pending verification
    const pendingDoctors = await prisma.doctor.findMany({
      where: {
        verificationStatus: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: true
          }
        }
      }
    });

    if (pendingDoctors.length === 0) {
      console.log('No pending doctors found.');
      return;
    }

    console.log(`Found ${pendingDoctors.length} pending doctors. Verifying them now...`);

    // Verify all pending doctors
    for (const doctor of pendingDoctors) {
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: {
          verificationStatus: 'verified',
          isAvailable: true
        }
      });

      console.log(`✅ Verified: Dr. ${doctor.user.profile.firstName} ${doctor.user.profile.lastName} (${doctor.user.email})`);
    }

    console.log(`Successfully verified ${pendingDoctors.length} doctors!`);

  } catch (error) {
    console.error('Error verifying doctors:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAllDoctors();
