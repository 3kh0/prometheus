import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const commands = new Map();

const files = readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'index.js');
for (const file of files) {
  const mod = await import(join(__dirname, file));
  if (mod.default?.name) {
    commands.set(mod.default.name, mod.default);
  }
}

export function registerCommands(app) {
  app.command('/pro', async ({ command, ack, respond, client, logger, context }) => {
    const recv = Date.now();
    await ack();

    const [subcommand, ...args] = command.text.trim().split(/\s+/);
    const handler = commands.get(subcommand);

    if (!handler) {
      await respond({
        response_type: 'ephemeral',
        text: `:x: Unknown command \`${subcommand}\`. Available: ${[...commands.keys()].join(', ')}`
      });
      return;
    }

    try {
      await handler.execute({ command, args, respond, client, logger, recv, context });
    } catch (error) {
      logger.error(`command ${subcommand} error: ${error.message}`);
      await respond({
        response_type: 'ephemeral',
        text: `:x: Error: ${error.message}`
      });
    }
  });
}

export { commands };
