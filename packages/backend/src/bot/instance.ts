// packages/backend/src/bot/instance.ts
import { Telegraf } from 'telegraf';
import { MyContext } from './index';

let botInstance: Telegraf<MyContext> | null = null;

export const setBotInstance = (bot: Telegraf<MyContext>) => {
  botInstance = bot;
};

export const getBotInstance = () => botInstance;
