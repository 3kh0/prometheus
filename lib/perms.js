async function mcheck(userId, channelId, logger) {
  try {
    const f = new FormData();
    f.append('token', process.env.SLACK_XOXC || '');
    f.append('entity_id', channelId);

    // AreWeEnterpriseYet
    const res = await fetch('https://slack.com/api/admin.roles.entity.listAssignments', {
      method: 'POST',
      body: f,
      headers: {
        Cookie: `d=${encodeURIComponent(process.env.SLACK_XOXD)}`
      }
    });

    const data = await res.json();

    if (!data.ok) {
      logger.error(`cant fetch roles for ${channelId}: ${data.error}`);
      return false;
    }

    const m = data.role_assignments[0]?.users || [];
    return m.includes(userId);
  } catch (error) {
    logger.error(`mcheck fail: ${error}`);
    return false;
  }
}

async function ccheck(userId, channelId, client, logger) {
  try {
    const x = await client.conversations.info({
      channel: channelId
    });
    return x?.channel?.creator === userId;
  } catch (error) {
    logger.error(`ccheck fail: ${error}`);
    if (error.data && error.data.error === 'channel_not_found') {
      // slack api my beloved
      return 'b';
    }
    return false;
  }
}

export async function check(client, logger, userId, channelId) {
  const m = await mcheck(userId, channelId, logger);
  if (m) return true;

  const c = await ccheck(userId, channelId, client, logger);
  return c;
}
