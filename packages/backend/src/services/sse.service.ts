// packages/backend/src/services/sse.service.ts
import { FastifyReply } from 'fastify';

class SSEService {
  private clients: Set<FastifyReply> = new Set();

  addClient(reply: FastifyReply) {
    this.clients.add(reply);
    console.log(`📡 SSE Client connected. Total clients: ${this.clients.size}`);
  }

  removeClient(reply: FastifyReply) {
    this.clients.delete(reply);
    console.log(`📡 SSE Client disconnected. Total clients: ${this.clients.size}`);
  }

  /**
   * Send an event to all connected clients
   */
  sendEvent(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.raw.write(payload);
      } catch (err) {
        console.error('Error sending SSE to client', err);
        this.removeClient(client);
      }
    }
  }

  /**
   * Keep-alive ping to prevent connection drops
   */
  keepAlive(reply: FastifyReply) {
    reply.raw.write(': keepalive\n\n');
  }
}

export const sseService = new SSEService();
