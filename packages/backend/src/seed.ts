// packages/backend/src/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding business hours...");
  
  const availabilityData = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "19:00" }, // Monday
    { dayOfWeek: 2, startTime: "09:00", endTime: "19:00" }, // Tuesday
    { dayOfWeek: 3, startTime: "09:00", endTime: "19:00" }, // Wednesday
    { dayOfWeek: 4, startTime: "09:00", endTime: "19:00" }, // Thursday
    { dayOfWeek: 5, startTime: "09:00", endTime: "19:00" }, // Friday
    { dayOfWeek: 6, startTime: "09:00", endTime: "16:00" }, // Saturday
  ];

  for (const data of availabilityData) {
    await prisma.availability.upsert({
      where: { dayOfWeek: data.dayOfWeek },
      update: {
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: true,
      },
      create: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: true,
      },
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
