import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const listeners = [];

const files = readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'index.js');
for (const file of files) {
  const mod = await import(join(__dirname, file));
  if (typeof mod.default === 'function') listeners.push(mod.default);
}

export function registerListeners(app) {
  app.event('message', async (args) => {
    for (const listener of listeners) {
      try {
        await listener(args);
      } catch (e) {
        args.logger?.error(`listener error: ${e.message}`);
      }
    }
  });
}

export { listeners };
