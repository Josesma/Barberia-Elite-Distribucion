import { prisma } from '@barberia/shared';
import { googleCalendarService } from '../services/google-calendar.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import dayjs from 'dayjs';
import { getBotInstance } from '../bot/instance';
import { sseService } from '../services/sse.service';

export class AppointmentController {
  /**
   * List appointments for a given day
   */
  async listForDay(req: FastifyRequest<{ Querystring: { date: string } }>, reply: FastifyReply) {
    const { date } = req.query;
    if (!date) return reply.status(400).send({ message: 'Fecha requerida' });

    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return reply.send(appointments);
  }

  /**
   * Update appointment status
   */
  async updateStatus(req: FastifyRequest<{ Params: { id: string }; Body: { status: any } }>, reply: FastifyReply) {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    return reply.send(appointment);
  }

  /**
   * Manual cancellation
   */
  async cancel(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = req.params;
    
    const appointment = await prisma.appointment.findUnique({ 
      where: { id },
      include: { user: true }
    });
    
    if (!appointment) return reply.status(404).send({ message: 'Cita no encontrada' });

    // Cancel in GCal
    if (appointment.googleEventId) {
      try {
        await googleCalendarService.deleteEvent(appointment.googleEventId);
      } catch (err) {
        console.error("Failed to delete GCal event:", err);
      }
    }

    // Mark as cancelled in DB
    await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Notify user via Telegram
    const bot = getBotInstance();
    if (bot && appointment.user.telegramId) {
      const dateStr = dayjs(appointment.startTime).format('DD/MM/YYYY');
      const timeStr = dayjs(appointment.startTime).format('HH:mm');
      try {
        await bot.telegram.sendMessage(
          appointment.user.telegramId,
          `❌ Hola ${appointment.user.firstName}, lamentamos informarte que tu cita del ${dateStr} a las ${timeStr} ha sido cancelada por la administración.`
        );
      } catch (err) {
        console.error("Failed to send Telegram message:", err);
      }
    }

    // Notify first person on waitlist for this date
    try {
      const startOfDay = dayjs(appointment.startTime).startOf('day').toDate();
      const endOfDay = dayjs(appointment.startTime).endOf('day').toDate();
      const waitlistEntry = await prisma.waitlistEntry.findFirst({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          notified: false,
        },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      });

      if (waitlistEntry && bot) {
        await prisma.waitlistEntry.update({
          where: { id: waitlistEntry.id },
          data: { notified: true },
        });
        const dateStr2 = dayjs(appointment.startTime).format('DD/MM');
        await bot.telegram.sendMessage(
          waitlistEntry.user.telegramId,
          `📢 ¡Buenas noticias, ${waitlistEntry.user.firstName}! Se liberó un horario para el ${dateStr2}. Escribe /start para reservar antes de que alguien más lo tome. 🚀`
        );
      }
    } catch (err) {
      console.error("Waitlist notification failed:", err);
    }

    sseService.sendEvent('dashboard-update', { 
      message: `🚫 Cita de ${appointment.user.firstName} cancelada.` 
    });

    return reply.send({ message: 'Cita cancelada correctamente' });
  }

  /**
   * Finalize appointment (Checkout)
   */
  async finish(req: FastifyRequest<{ Params: { id: string }; Body: { finalPrice: number, paymentMethod: string } }>, reply: FastifyReply) {
    const { id } = req.params;
    const { finalPrice, paymentMethod } = req.body;
    
    const appointment = await prisma.appointment.findUnique({ 
      where: { id },
      include: { user: true }
    });
    
    if (!appointment) return reply.status(404).send({ message: 'Cita no encontrada' });

    // Mark as finished in DB with new price and payment method
    await prisma.appointment.update({
      where: { id },
      data: { 
        status: 'FINISHED',
        price: finalPrice,
        paymentMethod: paymentMethod
      },
    });

    // Loyalty: increment visit count
    const updatedUser = await prisma.user.update({
      where: { id: appointment.user.id },
      data: { 
        visitCount: { increment: 1 },
        loyaltyTier: appointment.user.visitCount + 1 >= 20 ? 'Oro' 
                   : appointment.user.visitCount + 1 >= 10 ? 'Plata' 
                   : 'Bronce',
      },
    });

    // Notify user via Telegram
    const bot = getBotInstance();
    if (bot && appointment.user.telegramId) {
      try {
        let msg = `✅ ¡Muchas gracias por tu visita, ${appointment.user.firstName}! Esperamos verte pronto en la Barbería. 💈`;

        // Check loyalty reward
        if (updatedUser.visitCount % 5 === 0) {
          msg += `\n\n🎉 ¡Felicidades! Llevas ${updatedUser.visitCount} visitas. Tu próximo servicio tiene un 20% de descuento. ¡Gracias por tu lealtad!`;
        }

        await bot.telegram.sendMessage(appointment.user.telegramId, msg);
      } catch (err) {
        console.error("Failed to send Telegram message:", err);
      }
    }

    sseService.sendEvent('dashboard-update', { 
      message: `✅ Cita de ${appointment.user.firstName} completada con éxito.` 
    });

    return reply.send({ message: 'Cita finalizada correctamente' });
  }

  /**
   * Get dashboard stats
   */
  async getStats(req: FastifyRequest, reply: FastifyReply) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [todayCount, pendingCount, finishedCount, clientCount] = await Promise.all([
      prisma.appointment.count({
        where: { startTime: { gte: today, lt: tomorrow } }
      }),
      prisma.appointment.count({
        where: { status: 'PENDING' }
      }),
      prisma.appointment.count({
        where: { status: 'FINISHED' }
      }),
      prisma.user.count({
        where: { role: 'USER' }
      })
    ]);

    return reply.send({
      todayCount,
      pendingCount,
      finishedCount,
      clientCount
    });
  }
}

export const appointmentController = new AppointmentController();
