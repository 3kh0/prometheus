import 'dotenv/config';
import { App } from '@slack/bolt';
import { registerCommands } from './lib/commands/index.js';
import { registerShortcuts } from './lib/shortcuts/index.js';
import { registerListeners } from './lib/listeners/index.js';

const app = new App({
  token: process.env.SLACK_USER_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

registerCommands(app);
registerShortcuts(app);
registerListeners(app);

(async () => {
  await app.start();
  console.log(`fire stolen, legs broken`);
})();
