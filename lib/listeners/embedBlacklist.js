import { deleteAttachment } from "../moderation";

export const event = "message";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function messageSentListener({ event, client }) {
  if (!event?.user) return;

  if (event.subtype) return;

  // Check attachments a few times for robustness
  for (const delay of [0, 3000, 5000, 10000]) {
    await sleep(delay);
    // fetch message and check attachments

    const results = await client.conversations.history({
      channel: event.channel,
      latest: event.ts,
      inclusive: true,
      limit: 1,
    });
    const message = results.messages[0];
    // Message could have been deleted
    if (!message) return;

    // If no attachments, skip
    if (!message.attachments) continue;

    message.attachments.forEach(async (attachment) => {
      await deleteAttachment(event.channel, message.ts, attachment.id);
    });
    console.log(message);
  }
}
