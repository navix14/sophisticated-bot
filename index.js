const { Client, Events, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");
const { registerCommands } = require("./registerCommands");
const Users = require("./db/userModel");
const buildQueueEmbed = require("./embeds/queueEmbed");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

registerCommands(client);

function postQueue(channel) {
  const { queueEmbed, actions } = buildQueueEmbed();

  channel.send({ embeds: [queueEmbed] });

  channel.send({
    components: [actions],
  });
}

client.once(Events.ClientReady, async (c) => {
  Users.sync();

  console.log(`Ready! Logged in as ${c.user.tag}`);
  console.log("Synced database 'sophisticated.db'");

  const channel = await c.channels.fetch("1107365471436689448");
  await channel.bulkDelete(100);

  // postQueue(channel);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

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
});

client.login(token);
