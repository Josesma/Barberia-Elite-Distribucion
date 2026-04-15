// packages/backend/src/bot/index.ts
import { Telegraf, Context, Markup } from 'telegraf';
import { prisma } from '@barberia/shared';
import { availabilityService } from '../services/availability.service';
import { googleCalendarService } from '../services/google-calendar.service';
import { sseService } from '../services/sse.service';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

export interface MyContext extends Context {
  session: {
    step?: string;
    bookingDate?: string;
    bookingSlot?: any;
    serviceId?: string;
  };
}

import { setBotInstance } from './instance';

export const setupBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found');
    return null;
  }

  const bot = new Telegraf<MyContext>(token);
  setBotInstance(bot);

  bot.use(async (ctx, next) => {
    console.log("=== INCOMING UPDATE ===");
    console.log(JSON.stringify(ctx.update, null, 2));
    return next();
  });

  // In-memory session for simplicity in MVP
  const sessions = new Map<number, any>();

  const getSession = (ctx: MyContext) => {
    const id = ctx.from?.id;
    if (!id) return {};
    if (!sessions.has(id)) sessions.set(id, {});
    return sessions.get(id);
  };

  bot.start(async (ctx) => {
    const session = getSession(ctx);
    session.step = 'start';
    
    // Create/Update user in DB
    await prisma.user.upsert({
      where: { telegramId: ctx.from.id.toString() },
      update: {
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
      },
      create: {
        telegramId: ctx.from.id.toString(),
        username: ctx.from.username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
      },
    });

    await ctx.reply(
      `¡Hola ${ctx.from.first_name}! 👋😊 Bienvenido a la Barbería V2. ¿Qué te gustaría hacer hoy?`,
      Markup.keyboard([['📅 Reservar Cita', '📋 Mis Citas']]).resize()
    );
  });

  bot.hears(/Reservar Cita/i, async (ctx) => {
    const session = getSession(ctx);
    session.step = 'choosing_service';

    const services = await prisma.service.findMany({ where: { isActive: true } });
    
    if (services.length === 0) {
      return ctx.reply('Actualmente no hay servicios disponibles para reservar. Ingresa más tarde.');
    }

    const buttons = services.map(s => Markup.button.callback(`${s.name} - $${s.price}`, `service_${s.id}`));
    // agrupar botones de 1 en 1
    const arrangedButtons = buttons.map(b => [b]);

    await ctx.reply('¿Qué servicio te gustaría realizarte hoy?', Markup.inlineKeyboard(arrangedButtons));
  });

  bot.action(/^service_(.+)$/, async (ctx) => {
    const serviceId = ctx.match[1];
    const session = getSession(ctx);
    session.serviceId = serviceId;
    session.step = 'choosing_date';

    await ctx.answerCbQuery();

    // Show next 7 days
    const buttons = [];
    for (let i = 0; i < 7; i++) {
      const date = dayjs().add(i, 'day');
      buttons.push(Markup.button.callback(date.format('DD/MM (ddd)'), `date_${date.format('YYYY-MM-DD')}`));
    }

    await ctx.editMessageText('Excelente elección. Ahora, selecciona el día de tu cita:', Markup.inlineKeyboard(buttons, { columns: 2 }));
  });

  bot.action(/^date_(.+)$/, async (ctx) => {
    const date = ctx.match[1];
    const session = getSession(ctx);
    session.bookingDate = date;
    session.step = 'choosing_slot';

    await ctx.answerCbQuery();
    await ctx.editMessageText(`Consultando disponibilidad para el ${dayjs(date).format('DD/MM')}...`);

    try {
      const slots = await availabilityService.getAvailableSlots(date);

      if (slots.length === 0) {
        return ctx.reply(
          'Lo sentimos, no hay horarios disponibles para este día.',
          Markup.inlineKeyboard([
            Markup.button.callback('📋 Anotarme en lista de espera', `waitlist_${date}`),
          ])
        );
      }

      const slotButtons = slots.map((s: any) => Markup.button.callback(s.label, `slot_${s.start}`));
      await ctx.reply('Selecciona una hora:', Markup.inlineKeyboard(slotButtons, { columns: 3 }));
    } catch (err: any) {
      console.error("Availability Error:", err);
      return ctx.reply(`Ocurrió un error al consultar la disponibilidad: ${err.message}`);
    }
  });

  bot.action(/^slot_(.+)$/, async (ctx) => {
    const slotStart = ctx.match[1];
    const session = getSession(ctx);
    session.bookingSlot = slotStart;
    session.step = 'confirming';

    await ctx.answerCbQuery();
    const dateStr = dayjs(session.bookingDate).format('DD/MM/YYYY');
    const timeStr = dayjs(slotStart).format('HH:mm');

    await ctx.reply(
      `📝 *Resumen de tu Cita*\n\n📅 Fecha: ${dateStr}\n⏰ Hora: ${timeStr}\n\n¿Confirmas la reserva?`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('✅ Confirmar', 'confirm_booking'),
          Markup.button.callback('❌ Cancelar', 'cancel_booking'),
        ]),
      }
    );
  });

  bot.action('confirm_booking', async (ctx) => {
    const session = getSession(ctx);
    if (!session.bookingSlot) return ctx.reply('Error: Sesión expirada.');

    await ctx.answerCbQuery('Procesando reserva...');
    await ctx.editMessageText('⏳ Generando tu reserva...');

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: ctx.from!.id.toString() },
      });

      if (!user) throw new Error('Usuario no encontrado');

      const start = dayjs(session.bookingSlot).toDate();
      const end = dayjs(session.bookingSlot).add(30, 'minute').toDate();

      // 1. Create in Google Calendar
      const gcalEvent = await googleCalendarService.createEvent(
        `Cita Barbería: ${user.firstName} ${user.lastName || ''}`,
        `Cita reservada vía Telegram Bot`,
        start,
        end
      );

      let selectedService = await prisma.service.findUnique({ where: { id: session.serviceId || '' } });
      if (!selectedService) {
        // Fallback to first available service or a default mockup
        const first = await prisma.service.findFirst();
        selectedService = first || { id: '0', name: 'Servicio General', price: 0, duration: 30, isActive: true, createdAt: new Date(), updatedAt: new Date(), description: '' } as any;
      }
      
      const service = selectedService!;

      // 2. Save to DB
      await prisma.appointment.create({
        data: {
          userId: user.id,
          startTime: start,
          endTime: end,
          googleEventId: gcalEvent.id || undefined,
          serviceName: service.name,
          price: service.price,
          status: 'CONFIRMED',
        },
      });

      // Emit SSE to Dashboard
      sseService.sendEvent('dashboard-update', { 
        message: `¡Nueva cita reservada por ${user.firstName} para las ${dayjs(start).format('HH:mm')}!` 
      });

      await ctx.reply(`¡Reserva confirmada! ✅\nTe esperamos el ${dayjs(start).format('DD/MM')} a las ${dayjs(start).format('HH:mm')}.\n\nTu total aproximado será de $${service.price}. ¡Nos vemos pronto!`);
      session.step = 'start';
    } catch (error) {
      console.error(error);
      await ctx.reply('Ocurrió un error al procesar tu reserva. Por favor intenta más tarde.');
    }
  });

  bot.action('cancel_booking', async (ctx) => {
    const session = getSession(ctx);
    session.step = 'start';
    await ctx.answerCbQuery();
    await ctx.reply('Reserva cancelada. ¿Hay algo más en lo que pueda ayudarte?');
  });

  // === REMINDER HANDLERS ===
  bot.action(/^reminder_onway_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery('¡Perfecto!');
    await ctx.editMessageText('✅ ¡Genial! Te esperamos, ve con cuidado. 💈');
  });

  bot.action(/^reminder_cancel_(.+)$/, async (ctx) => {
    const apptId = ctx.match[1];
    await ctx.answerCbQuery('Cancelando...');
    try {
      await prisma.appointment.update({
        where: { id: apptId },
        data: { status: 'CANCELLED' },
      });

      sseService.sendEvent('dashboard-update', { 
        message: `⚠️ Un cliente ha cancelado su cita de forma interactiva.` 
      });

      await ctx.editMessageText('❌ Tu cita ha sido cancelada. Esperamos verte pronto.');
    } catch (err) {
      console.error(err);
      await ctx.editMessageText('Hubo un error al cancelar. Contáctanos directamente.');
    }
  });

  // === WAITLIST HANDLER ===
  bot.action(/^waitlist_(.+)$/, async (ctx) => {
    const date = ctx.match[1];
    await ctx.answerCbQuery();
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: ctx.from!.id.toString() },
      });
      if (!user) return ctx.reply('Error: usuario no encontrado.');

      await prisma.waitlistEntry.create({
        data: {
          userId: user.id,
          date: new Date(date),
        },
      });

      await ctx.editMessageText(`📋 ¡Listo! Te hemos anotado en la lista de espera para el ${dayjs(date).format('DD/MM')}. Si se libera un horario, te notificaremos de inmediato. 👍`);
    } catch (err) {
      console.error(err);
      await ctx.reply('Hubo un error al registrarte. Intenta de nuevo.');
    }
  });

  // === LOYALTY: /mispuntos ===
  bot.command('mispuntos', async (ctx) => {
    const user = await prisma.user.findUnique({
      where: { telegramId: ctx.from.id.toString() },
    });
    if (!user) return ctx.reply('No tienes un perfil registrado. Escribe /start primero.');

    const nextReward = 5 - (user.visitCount % 5);
    const progress = '⭐'.repeat(user.visitCount % 5) + '☆'.repeat(nextReward);

    await ctx.reply(
      `🏆 *Programa de Lealtad*\n\n` +
      `Nivel: *${user.loyaltyTier || 'Bronce'}*\n` +
      `Visitas: *${user.visitCount}*\n` +
      `Progreso: ${progress}\n\n` +
      `Te faltan *${nextReward}* visitas para tu próximo descuento. ¡Sigue así!`,
      { parse_mode: 'Markdown' }
    );
  });

  // Handle generic text messages (like "Hola")
  bot.on('text', async (ctx) => {
    const session = getSession(ctx);
    if (!session.step || session.step === 'start') {
      await ctx.reply('¡Hola! 👋 Para reservar una cita usa el botón de abajo o escribe /start.', 
        Markup.keyboard([['📅 Reservar Cita', '📋 Mis Citas']]).resize());
    }
  });

  return bot;
}
