const {
  Client,
  Events,
  GatewayIntentBits,
  ChannelType,
} = require("discord.js");
const { token } = require("./config.json");
const { registerCommands } = require("./registerCommands");
const Users = require("./db/userModel");
const Games = require("./db/gameModel");
const Queue = require("./queue/queue");
const XeroClient = require("./xero-api/xeroClient");
const RankedGame = require("./game");

const xeroClient = new XeroClient();
let queue = null;
let nextGameId = 1;

const channels = {};
const activeGames = [];

async function fetchChannels(c) {
  // Get channel list
  const queueChannel = c.channels.cache.find(
    (channel) => channel.name === "queue-v3"
  );

  const gamesCategoryChannel = c.channels.cache.find(
    (channel) => channel.name === "games"
  );

  const botSpamChannel = c.channels.cache.find(
    (channel) => channel.name === "bot-spam"
  );

  channels["queue-v3"] = queueChannel;
  channels["games"] = gamesCategoryChannel;
  channels["bot-spam"] = botSpamChannel;
}

async function setupGame(game) {
  const { channel, players } = game;

  // Shuffle players array
  const playersShuffled = players.sort(() => 0.5 - Math.random());

  // Pick captains
  game.setCaptainA(playersShuffled[0]);
  game.setCaptainB(playersShuffled[1]);

  const mentionString = playersShuffled.map((p) => `${p}`).join(" ");

  await channel.send(`${mentionString}
Captains have been chosen!

Captain A: **${game.captainA}**
Captain B: **${game.captainB}**`);

  await channel.send({ embeds: [game.createEmbed()] });

  activeGames.push(game);
  nextGameId += 1;
}

function getDiscordNameFromUser(user) {
  return `${user.username}#${user.discriminator}`;
}

async function handleQueueConfirm(interaction) {
  // Check if member is already in queue
  if (queue.contains(interaction.member)) {
    return interaction.reply({
      content: "You are in the queue already.",
      ephemeral: true,
    });
  }

  const user = await Users.findOne({
    where: { discord_name: getDiscordNameFromUser(interaction.user) },
  });

  // Check if user is linked
  if (user === null) {
    return interaction.reply({
      content:
        "You have to link your Xero account first. Use the `/register` command",
      ephemeral: true,
    });
  }

  const player = await xeroClient.fetchPlayer(user.ingame_name);

  // Check if player is at least semi level
  if (player.level < 21) {
    return interaction.reply({
      content: `You have to be at least <:semipro:1107784693421711491> (Semi-Pro) to play ranked. Either wait until you level up or link to another account. To un-link in this case, ask an Admin.`,
      ephemeral: true,
    });
  }

  // Check if player is already in a game
  for (const id in activeGames) {
    const game = activeGames[id];
    if (game.players.includes(interaction.member)) {
      return interaction.reply({
        content: `You are already part of a game, see ${game.channel}`,
        ephemeral: true,
      });
    }
  }

  await queue.add(interaction.member);

  await interaction.reply({
    content: "You joined the queue!",
    ephemeral: true,
  });

  if (queue.isFull()) {
    const gameChannel = await interaction.guild.channels.create({
      name: `game-${nextGameId}`,
      type: ChannelType.GuildText,
      parent: channels["games"],
    });

    const game = new RankedGame({
      gameId: nextGameId,
      channel: gameChannel,
      players: queue.players,
    });

    setupGame(game);

    queue.reset();
    setTimeout(() => queue.postEmbed(), 1500);
  }
}

async function handleQueueCancel(interaction) {
  if (!queue.contains(interaction.member)) {
    return interaction.reply({
      content: "You're not in the queue.",
      ephemeral: true,
    });
  }

  queue.remove(interaction.member);

  return interaction.reply({
    content: "You left the queue.",
    ephemeral: true,
  });
}

async function handleCommands(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  interaction.activeGames = activeGames;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

registerCommands(client);

client.once(Events.ClientReady, async (c) => {
  Users.sync();
  Games.sync();

  console.log(`Ready! Logged in as ${c.user.tag}`);
  console.log("Synced database 'sophisticated.db'");

  fetchChannels(c);

  queue = new Queue(channels["queue-v3"], 6);

  await queue.postEmbed();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === "confirm") {
      return handleQueueConfirm(interaction);
    }

    if (interaction.customId === "cancel") {
      return handleQueueCancel(interaction);
    }
  }

  if (interaction.isModalSubmit()) {
    return interaction.reply({
      content: "Successfully edited player stats!",
      ephemeral: true,
    });
  }

  if (interaction.isChatInputCommand()) {
    handleCommands(interaction);
  }
});

client.login(token);
