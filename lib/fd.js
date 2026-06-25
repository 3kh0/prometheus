const SHROUD_API_URL = process.env.SHROUD_API_URL;
const SHROUD_API_TOKEN = process.env.SHROUD_API_TOKEN;

export async function fdReportDelete({ channel, message, deletedBy, reason }) {
  if (!SHROUD_API_URL || !SHROUD_API_TOKEN) return;

  const sender = message.user || 'unknown';
  const text = message.text || '_no text content_';
  const ts = message.ts;

  const content = [
    `*[Prometheus Report]* <@${deletedBy}> deleted a message from <@${sender}> in <#${channel}> <!date^${Math.floor(parseFloat(ts))}^{date_short_pretty} {time_secs}|${ts}>`,
    `*Reason:* ${reason}`,
    `*Deleted content:*\n>>> ${text}`,
  ].join('\n');

  try {
    const response = await fetch(SHROUD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SHROUD_API_TOKEN}`,
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      console.warn(`Shroud API returned ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.warn('Failed to send report to Shroud API:', error.message);
  }
}
