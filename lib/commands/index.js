import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const commands = new Map();
const slashCommands = new Map();

const files = readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== 'index.js');
for (const file of files) {
  const mod = await import(join(__dirname, file));
  if (mod.default?.name) commands.set(mod.default.name, mod.default);
  if (mod.default?.slash) slashCommands.set(mod.default.slash, mod.default);
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

  for (const [slash, handler] of slashCommands) {
    app.command(slash, async ({ command, ack, respond, client, logger, context }) => {
      const recv = Date.now();
      await ack();

      try {
        const args = command.text.trim().split(/\s+/).filter(Boolean);
        await handler.execute({ command, args, respond, client, logger, recv, context });
      } catch (error) {
        logger.error(`command ${slash} error: ${error.message}`);
        await respond({ response_type: 'ephemeral', text: `:x: Error: ${error.message}` });
      }
    });
  }
}

export { commands, slashCommands };
