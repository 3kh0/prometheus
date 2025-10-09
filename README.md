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
2. Setup a slack App with these user scopes: `channels:history`, `channels:read`, `chat:write`, `groups:history`, `groups:read`, `im:history`, `mpim:history`, `users:read`. Keep in mind this will only work if you have Workspace Admin
3. Enable Socket Mode
4. Setup a message shortcut with the ID `destroy_thread` and `delete_message` and name them accordingly.
5. Fill out the `.env` file (see `.env.example` if ur lost)
6. `pnpm i && pnpm start`
7. Profit???

You should be able to see two new message actions.

<img width="267" height="115" alt="2025_10_08_0z1_Kleki" src="https://github.com/user-attachments/assets/ac48c2f0-31b4-4acc-8ea0-e9ed40612245" />

Deleting messages has no confirmation window, while nuking a thread does to prevent any misclicks

<img width="453" height="199" alt="2025_10_08_0yz_Kleki" src="https://github.com/user-attachments/assets/da4b4aa3-0171-4b94-9a0e-ed469537f36b" />

## License

See [LICENSE](LICENSE) for the legal mumbo jumbo.
