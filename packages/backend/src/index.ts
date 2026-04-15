// packages/backend/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import path from 'path';
import { appointmentRoutes } from './routes/appointment.routes';
import { setupBot } from './bot';
import { setupReminders } from './cron/reminders';
import { financeRoutes } from './routes/finance.routes';

const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

console.log("ENV LOADED:", envPath);
console.log("Has Email?", !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
console.log("Has Key?", !!process.env.GOOGLE_PRIVATE_KEY);

const fastify = Fastify({
  logger: true,
});

const start = async () => {
  try {
    // 1. Plugins
    await fastify.register(cors, {
      origin: '*',
    });

    // 2. Routes
    await fastify.register(appointmentRoutes, { prefix: '/api' });
    await fastify.register(financeRoutes, { prefix: '/api' });

    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // SSE Stream Route
    fastify.get('/api/stream', (req, reply) => {
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');
      reply.raw.flushHeaders();
      
      reply.hijack();
      
      reply.raw.write('retry: 10000\n\n'); // Reconnect time
      
      const sseService = require('./services/sse.service').sseService;
      sseService.addClient(reply);

      req.raw.on('close', () => {
        sseService.removeClient(reply);
      });
    });

    fastify.get('/api/test-sse', async (req, reply) => {
      const sseService = require('./services/sse.service').sseService;
      sseService.sendEvent('dashboard-update', { message: '🚀 Prueba de notificación en tiempo real exitosa.' });
      return { ok: true };
    });

    // Keep-alive interval for all clients
    setInterval(() => {
      const sseService = require('./services/sse.service').sseService;
      for (const client of (sseService as any).clients) {
        sseService.keepAlive(client);
      }
    }, 15000);

    // 3. Bot & Reminders
    const bot = setupBot();
    if (bot) {
      bot.launch();
      setupReminders(bot as any);
      console.log('🤖 Telegram Bot launched');
    }

    // 4. Server Listen
    const port = Number(process.env.PORT) || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    
    console.log(`🚀 Backend server running at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
