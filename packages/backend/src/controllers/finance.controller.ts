// packages/backend/src/controllers/finance.controller.ts
import { prisma } from '@barberia/shared';
import { FastifyReply, FastifyRequest } from 'fastify';
import dayjs from 'dayjs';

export class FinanceController {
  async getReport(req: FastifyRequest<{ Querystring: { period: 'day' | 'week' | 'month' } }>, reply: FastifyReply) {
    const { period = 'month' } = req.query;

    const start = dayjs().startOf(period).toDate();
    const end = dayjs().endOf(period).toDate();

    const [appointments, expenses] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          startTime: { gte: start, lte: end },
          status: 'FINISHED',
        },
      }),
      prisma.expense.findMany({
        where: {
          date: { gte: start, lte: end },
        },
      }),
    ]);

    // Calcular ingresos (separando Efectivo y Tarjeta)
    let incomeCash = 0;
    let incomeCard = 0;
    appointments.forEach((app: any) => {
      const p = Number(app.price || 0);
      if (app.paymentMethod === 'Tarjeta') incomeCard += p;
      else incomeCash += p;
    });
    const income = incomeCash + incomeCard;

    // Calcular gastos (separando Efectivo y Tarjeta)
    let expenseCash = 0;
    let expenseCard = 0;
    expenses.forEach((exp: any) => {
      const amt = Number(exp.amount || 0);
      if (exp.paymentMethod === 'Tarjeta') expenseCard += amt;
      else expenseCash += amt;
    });
    const expenseTotal = expenseCash + expenseCard;
    
    const profit = income - expenseTotal;

    return reply.send({
      period,
      start,
      end,
      income,
      incomeCash,
      incomeCard,
      expenseTotal,
      expenseCash,
      expenseCard,
      profit,
      appointmentsCount: appointments.length,
      expensesCount: expenses.length,
    });
  }
}

export const financeController = new FinanceController();
