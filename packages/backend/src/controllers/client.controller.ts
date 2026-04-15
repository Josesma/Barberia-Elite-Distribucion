// packages/backend/src/controllers/client.controller.ts
import { prisma } from '@barberia/shared';
import { FastifyReply, FastifyRequest } from 'fastify';

export class ClientController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const clients = await prisma.user.findMany({
      where: {
        role: 'USER'
      },
      include: {
        _count: {
          select: { appointments: true }
        },
        appointments: {
          take: 1,
          orderBy: { startTime: 'desc' }
        }
      }
    });

    return reply.send(clients);
  }
}

export const clientController = new ClientController();
