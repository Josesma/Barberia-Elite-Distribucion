import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.service.count();
  if (count === 0) {
    await prisma.service.create({
      data: {
        name: 'Corte de Cabello',
        price: 200,
        duration: 30,
        isActive: true,
      }
    });
    console.log('Servicio creado.');
  } else {
    console.log('Ya existen servicios.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
