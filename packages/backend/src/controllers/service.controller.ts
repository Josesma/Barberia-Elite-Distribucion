// packages/backend/src/controllers/service.controller.ts
import { prisma } from '@barberia/shared';
import { FastifyReply, FastifyRequest } from 'fastify';

export class ServiceController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(services);
  }

  async create(req: FastifyRequest<{ Body: { name: string; price: number; duration?: number; description?: string } }>, reply: FastifyReply) {
    const { name, price, duration, description } = req.body;
    try {
      const service = await prisma.service.create({
        data: { name, price, duration, description },
      });
      return reply.send(service);
    } catch (err: any) {
      if (err.code === 'P2002') return reply.status(400).send({ message: 'El servicio ya existe' });
      return reply.status(500).send({ message: 'Error interno del servidor' });
    }
  }

  async update(req: FastifyRequest<{ Params: { id: string }; Body: { price?: number; isActive?: boolean } }>, reply: FastifyReply) {
    const { id } = req.params;
    const { price, isActive } = req.body;
    const service = await prisma.service.update({
      where: { id },
      data: { price, isActive },
    });
    return reply.send(service);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = req.params;
    await prisma.service.delete({ where: { id } });
    return reply.send({ message: 'Servicio eliminado' });
  }
}

export const serviceController = new ServiceController();
