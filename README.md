<h1 align="center">
  <img alt="icon" width="250" src="https://github.com/user-attachments/assets/8061b824-f02c-45db-b5e7-de8f0a401b7b" />
  <br>Prometheus
</h1>

*Prometheus is known for stealing fire from the gods and giving it to humanity.*

Prometheus is a slack bot that allows community members to manage their own channels.

All actions work only if the user is a channel manager for public channels or a channel creator for private channels.

## Features

- Message deletion
- Nuke a thread (aka Threadripper)
- More soon:tm:

## Setup

1. Clone
2. Create a Slack app from [`slack.manifest.yaml`](./slack.manifest.yaml).
3. Install/reinstall the app to your workspace so all scopes are granted.
4. Create an app-level token with `connections:write` (for Socket Mode) and put it in `SLACK_APP_TOKEN`.
5. Fill out the `.env` file (see `.env.example` if ur lost):
   - `SLACK_BOT_TOKEN`: Bot User OAuth Token (xoxb)
   - `SLACK_USER_TOKEN`: User OAuth Token (xoxp, token holder should be Workspace Admin/Owner for admin APIs)
   - `SLACK_APP_TOKEN`: App-Level Token (xapp) with `connections:write`
   - `SLACK_SIGNING_SECRET`: Signing secret from the app settings
   - `SUPERADMINS`: Comma-separated Slack user IDs to seed as global admins (e.g. `U12345678,U87654321`)
   - `LOG_CHANNEL`: Channel ID to post audit logs to (optional but recommended)
   - `HACKCLUB_CDN_KEY`: CDN API key for archiving deleted thread transcripts (optional)
6. All commands is routed through `/pro`.
7. `bun install && bun start`
8. Profit???

You should be able to see two new message actions.

<img width="267" height="115" alt="2025_10_08_0z1_Kleki" src="https://github.com/user-attachments/assets/ac48c2f0-31b4-4acc-8ea0-e9ed40612245" />

Deleting messages has no confirmation window, while nuking a thread does to prevent any misclicks

<img width="453" height="199" alt="2025_10_08_0yz_Kleki" src="https://github.com/user-attachments/assets/da4b4aa3-0171-4b94-9a0e-ed469537f36b" />

## License

See [LICENSE](LICENSE) for the legal mumbo jumbo.
