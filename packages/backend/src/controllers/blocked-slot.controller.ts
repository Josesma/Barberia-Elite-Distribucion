// packages/backend/src/controllers/blocked-slot.controller.ts
import { prisma } from '@barberia/shared';
import { FastifyReply, FastifyRequest } from 'fastify';
import dayjs from 'dayjs';

export class BlockedSlotController {
  async list(req: FastifyRequest<{ Querystring: { date?: string } }>, reply: FastifyReply) {
    const { date } = req.query;
    const where: any = {};
    if (date) {
      const start = dayjs(date).startOf('day').toDate();
      const end = dayjs(date).endOf('day').toDate();
      where.date = { gte: start, lte: end };
    }
    const slots = await prisma.blockedSlot.findMany({ where, orderBy: { date: 'asc' } });
    return reply.send(slots);
  }

  async create(req: FastifyRequest<{ Body: { date: string; startTime: string; endTime: string; reason?: string } }>, reply: FastifyReply) {
    const { date, startTime, endTime, reason } = req.body;
    const slot = await prisma.blockedSlot.create({
      data: {
        date: new Date(date),
        startTime,
        endTime,
        reason: reason || 'Bloqueado manualmente',
      },
    });
    return reply.send(slot);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await prisma.blockedSlot.delete({ where: { id: req.params.id } });
    return reply.send({ message: 'Bloqueo eliminado' });
  }
}

export const blockedSlotController = new BlockedSlotController();
