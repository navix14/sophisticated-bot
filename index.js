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

let queue = null;
let nextGameId = 1;

const channels = {};

async function fetchChannels(c) {
  // Get channel list
  const queueChannel = c.channels.cache.find(
    (channel) => channel.name === "queue-v3"
  );

  const gamesCategoryChannel = c.channels.cache.find(
    (channel) => channel.name === "games"
  );

  channels["queue-v3"] = queueChannel;
  channels["games"] = gamesCategoryChannel;
}

async function handleQueueConfirm(interaction) {
  if (queue.contains(interaction.member)) {
    return interaction.reply({
      content: "You are in the queue already.",
      ephemeral: true,
    });
  }

  queue.add(interaction.member);

  await queue.embedMessage.edit({
    embeds: [queue.createEmbed()],
  });

  await interaction.reply({
    content: "You joined the queue!",
    ephemeral: true,
  });

  if (queue.isFull()) {
    await interaction.guild.channels.create({
      name: `game-${nextGameId}`,
      type: ChannelType.GuildText,
      parent: channels["games"],
    });

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

  await queue.embedMessage.edit({
    embeds: [queue.createEmbed()],
  });

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

  if (interaction.isChatInputCommand()) {
    handleCommands(interaction);
  }
});

client.login(token);
