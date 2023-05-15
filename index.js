const {
  Client,
  Events,
  GatewayIntentBits,
  ChannelType,
} = require("discord.js");
const { token } = require("./config.json");
const { registerCommands } = require("./registerCommands");
const Users = require("./db/userModel");
const buildQueueEmbed = require("./embeds/queueEmbed");

let queueMessage = null;
let queue = [];
let nextGameId = 1;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

registerCommands(client);

async function postQueue(channel) {
  await channel.bulkDelete(100);

  const { queueEmbed, actions } = buildQueueEmbed(queue.length);

  queueMessage = await channel.send({ embeds: [queueEmbed] });

  await channel.send({
    components: [actions],
  });
}

async function handleQueueConfirm(interaction) {
  if (queue.includes(interaction.member)) {
    return interaction.reply({
      content: "You are in the queue already.",
      ephemeral: true,
    });
  }

  queue.push(interaction.member);
  const { queueEmbed } = buildQueueEmbed(queue.length);

  // Put member into queue
  await queueMessage.edit({
    embeds: [queueEmbed],
  });

  const response = await interaction.reply({
    content: "You joined the queue!",
    ephemeral: true,
  });

  // Create game channel
  if (queue.length === 6) {
    await interaction.guild.channels.create({
      name: `game-${nextGameId}`,
      type: ChannelType.GuildText,
      parent: "1107704721814335579",
    });

    nextGameId++;

    queue = [];

    postQueue(interaction.channel);
  }

  return response;
}

async function handleQueueCancel(interaction) {
  if (!queue.includes(interaction.member)) {
    return interaction.reply({
      content: "You're not in the queue.",
      ephemeral: true,
    });
  }

  queue = queue.filter((member) => member !== interaction.member);
  const { queueEmbed } = buildQueueEmbed(queue.length);

  await queueMessage.edit({
    embeds: [queueEmbed],
  });

  const response = await interaction.reply({
    content: "You left the queue.",
    ephemeral: true,
  });

  return response;
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

client.once(Events.ClientReady, async (c) => {
  Users.sync();

  console.log(`Ready! Logged in as ${c.user.tag}`);
  console.log("Synced database 'sophisticated.db'");

  const queueChannel = await c.channels.fetch("1107365471436689448");

  await postQueue(queueChannel);
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
