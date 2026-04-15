import { FastifyInstance } from 'fastify';
import { serviceController } from '../controllers/service.controller';
import { expenseController } from '../controllers/expense.controller';
import { financeController } from '../controllers/finance.controller';
import { blockedSlotController } from '../controllers/blocked-slot.controller';

export async function financeRoutes(fastify: FastifyInstance) {
  // Services
  fastify.get('/services', serviceController.list);
  fastify.post('/services', serviceController.create);
  fastify.patch('/services/:id', serviceController.update);
  fastify.delete('/services/:id', serviceController.delete);

  // Expenses
  fastify.get('/expenses', expenseController.list);
  fastify.post('/expenses', expenseController.create);
  fastify.delete('/expenses/:id', expenseController.delete);

  // Finances
  fastify.get('/finances/report', financeController.getReport);

  // Blocked Slots
  fastify.get('/blocked-slots', blockedSlotController.list);
  fastify.post('/blocked-slots', blockedSlotController.create);
  fastify.delete('/blocked-slots/:id', blockedSlotController.delete);
}
