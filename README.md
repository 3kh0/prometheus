<h1 align="center">
  <img alt="icon" width="250" src="https://github.com/user-attachments/assets/8061b824-f02c-45db-b5e7-de8f0a401b7b" />
  <br>Prometheus
</h1>

*Prometheus is known for stealing fire from the gods and giving it to humanity.*

Prometheus is a slack bot designed to allow community members to manage their own channels.

All actions only work if the user is a channel manager for public channels or channel creator for private channels.

## Features

- Message deletion
- Nuke a thread (aka Threadripper)
- More soon:tm:

## Setup

1. Clone
2. Setup a slack App with these user scopes: `channels:history`, `channels:read`, `chat:write`, `groups:history`, `groups:read`, `im:history`, `mpim:history`, `users:read`
3. Enable Socket Mode
4. Setup a message shortcut with the ID `destroy_thread` and `delete_message` and name them respectively.
5. Fill out the `.env` file (see `.env.example` if ur lost)
6. `pnpm i && pnpm start`
7. Profit???

## License

See [LICENSE](LICENSE) for the legal mumbo jumbo.
