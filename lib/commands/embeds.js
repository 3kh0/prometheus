import { listEmbedBlocks } from "../db.js";

function ruleText(rule) {
  if (rule.type === "domain") return `*.${rule.target}/*`;
  if (rule.type === "host") return `${rule.target}/*`;
  if (rule.type === "path") return `${rule.target}/*`;
  return rule.target;
}

export default {
  name: "embeds",
  description: "Manage blacklisted embeds",
  async execute({ command, respond }) {
    const rules = listEmbedBlocks(command.channel_id);

    if (!rules.length) {
      await respond({
        response_type: "ephemeral",
        text: "No blacklisted embeds in this channel.",
      });
      return;
    }

    await respond({
      response_type: "ephemeral",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Blacklisted embeds in <#${command.channel_id}>*\n${rules
              .map((rule) => `• \`${ruleText(rule)}\` blocked by <@${rule.blocked_by}>`)
              .join("\n")}`,
          },
        },
      ],
      text: `Blacklisted embeds: ${rules.map(ruleText).join(", ")}`,
    });
  },
};
