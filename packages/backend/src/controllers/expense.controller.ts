// packages/backend/src/controllers/expense.controller.ts
import { prisma } from '@barberia/shared';
import { FastifyReply, FastifyRequest } from 'fastify';

export class ExpenseController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' },
      take: 50,
    });
    return reply.send(expenses);
  }

  async create(req: FastifyRequest<{ Body: { description: string; amount: number; category?: string; date?: string; paymentMethod?: string } }>, reply: FastifyReply) {
    const { description, amount, category, date, paymentMethod } = req.body;
    const expense = await prisma.expense.create({
      data: {
        description,
        amount,
        category: category || 'Operativo',
        paymentMethod: paymentMethod || 'Efectivo',
        date: date ? new Date(date) : new Date(),
      },
    });
    return reply.send(expense);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id } });
    return reply.send({ message: 'Gasto eliminado' });
  }
}

export const expenseController = new ExpenseController();
