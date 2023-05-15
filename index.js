const {
  Client,
  Events,
  GatewayIntentBits,
  ChannelType,
} = require("discord.js");
const { token } = require("./config.json");
const { registerCommands } = require("./registerCommands");
const Users = require("./db/userModel");
const Queue = require("./queue/queue");
const XeroClient = require("./xero-api/xeroClient");

const xeroClient = new XeroClient();
let queue = null;
let nextGameId = 1;

const channels = {};
const games = {};

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

async function setupGameChannel(gameInfo) {
  const { channel, players } = gameInfo;

  // Shuffle players array
  const playersShuffled = players.sort(() => 0.5 - Math.random());

  // Pick captains
  const captainA = playersShuffled[0];
  const captainB = playersShuffled[1];

  channel.send(`Captains have been chosen!

Captain A: **${captainA.user}**
Captain B: **${captainB.user}**`);
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
  for (const id in games) {
    const game = games[id];
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

    games[nextGameId] = {
      channel: gameChannel,
      players: queue.queue,
      state: "pick-a",
    };

    setupGameChannel(games[nextGameId]);

    nextGameId += 1;

    queue.reset();
    await queue.postEmbed();
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

  console.log(`Ready! Logged in as ${c.user.tag}`);
  console.log("Synced database 'sophisticated.db'");

  fetchChannels(c);

  queue = new Queue(channels["queue-v3"], 2);

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

  if (interaction.isChatInputCommand()) {
    handleCommands(interaction);
  }
});

client.login(token);
