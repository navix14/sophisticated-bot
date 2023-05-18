# Sophisticated Bot
xero.gg ranked bot for Discord server.

## Usage

Basic configuration to get the bot running:

1. Create a `config.json` file. It should have entries for `token`, `clientId` and `guildId`. Refer to the Discord Developer Portal.
2. Execute `node deploy-commands.js` to register the commands.
3. Execute `node index.js` to run the bot.

Your Discord server needs a category called `games` and a channel called `queue`. The queue channel will contain an embed asking users to join the queue. Once the queue is full, a game channel will be created and the matchmaking process starts.

Only registered users can join a queue. A user can register by linking their Xero game account using the `/register` command. Note that Xero accounts need to be at least Semi Pro to be able to join a queue.

Admins have the ability to manually unlink users using `/unlink` or re-link using `/force_link` accounts in case of mistakes or abuse of the system.

## Commands

### Basic commands
```
/hello - Test command, bot says "hello" to you
/bulkDelete <num_messages> - Deletes the last <num_messages> messages in the channel where the command is issued
/player_info <ingame_name> - Retrieves basic player info from xero.gg and displays it
```

### Ranked commands
```
/register <ingame_name> - Links your Discord account with a Xero account
/force_register <discord_user> <ingame_name> - Forces a link between a Discord and Xero account. Admin-only
/unlink <discord_user> - Unlinks a user completely, so they are able to register again
/pick <discord_user> - If in a ranked game, a team captain can pick a player for their team
```