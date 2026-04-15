// packages/backend/src/routes/appointment.routes.ts
import { FastifyInstance } from 'fastify';
import { appointmentController } from '../controllers/appointment.controller';
import { clientController } from '../controllers/client.controller';
import { availabilityService } from '../services/availability.service';
import { prisma } from '@barberia/shared';
import dayjs from 'dayjs';

export const appointmentRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/appointments', appointmentController.listForDay);
  fastify.patch('/appointments/:id/status', appointmentController.updateStatus);
  fastify.post('/appointments/:id/cancel', appointmentController.cancel);
  fastify.post('/appointments/:id/finish', appointmentController.finish);

  fastify.get('/clients', clientController.list);
  fastify.get('/stats', appointmentController.getStats);

  fastify.get('/availability', async (req: any) => {
    const { date } = req.query;
    return availabilityService.getAvailableSlots(date);
  });

  // Client history
  fastify.get('/clients/:id/history', async (req: any, reply: any) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 50,
        },
      },
    });
    if (!user) return reply.status(404).send({ message: 'Cliente no encontrado' });

    const totalSpent = user.appointments
      .filter((a: any) => a.status === 'FINISHED')
      .reduce((sum: number, a: any) => sum + Number(a.price || 0), 0);

    return reply.send({
      ...user,
      totalSpent,
      totalVisits: user.appointments.filter((a: any) => a.status === 'FINISHED').length,
    });
  });

  // Waitlist
  fastify.get('/waitlist', async (req: any, reply: any) => {
    const { date } = req.query;
    const where: any = { notified: false };
    if (date) {
      where.date = {
        gte: dayjs(date).startOf('day').toDate(),
        lte: dayjs(date).endOf('day').toDate(),
      };
    }
    const entries = await prisma.waitlistEntry.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return reply.send(entries);
  });
};
