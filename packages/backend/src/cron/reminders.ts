// packages/backend/src/cron/reminders.ts
import cron from 'node-cron';
import { prisma } from '@barberia/shared';
import dayjs from 'dayjs';
import { Telegraf, Markup } from 'telegraf';

export const setupReminders = (bot: Telegraf) => {
  // Check every 15 minutes for citas in the next hour
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Checking for upcoming appointments...');
    
    const now = dayjs();
    const oneHourFromNow = now.add(75, 'minute');

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: now.toDate(),
          lte: oneHourFromNow.toDate(),
        },
        status: 'CONFIRMED',
        reminderSent: false,
      },
      include: {
        user: true,
      },
    });

    for (const appt of appointments) {
      try {
        const timeStr = dayjs(appt.startTime).format('HH:mm');
        await bot.telegram.sendMessage(
          appt.user.telegramId,
          `⏰ *Recordatorio*\n\nTu cita es hoy a las *${timeStr}*. ¿Vienes en camino?`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              Markup.button.callback('✅ Estoy en camino', `reminder_onway_${appt.id}`),
              Markup.button.callback('❌ Necesito cancelar', `reminder_cancel_${appt.id}`),
            ]),
          }
        );
        
        // Mark reminder as sent
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminderSent: true },
        });
        
        console.log(`✅ Reminder sent to ${appt.user.firstName} for ${timeStr}`);
      } catch (error) {
        console.error(`❌ Failed to send reminder to ${appt.user.telegramId}:`, error);
      }
    }
  });
};
