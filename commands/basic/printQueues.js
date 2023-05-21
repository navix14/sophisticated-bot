const { SlashCommandBuilder } = require("discord.js");
const buildInfoEmbed = require("../../embeds/infoEmbed");
const { QueueManager } = require("../../game");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue_info")
    .setDescription("Fetch player info from xero.gg")
    .addStringOption((option) =>
      option.setName("name").setDescription("Queue name").setRequired(true)
    )
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    const queueName = interaction.options.getString("name");

    if (interaction.channel.name.toLowerCase() !== "staff-chat") {
      return interaction.reply({
        content: "You can only execute this command in staff channels",
        ephemeral: true,
      });
    }

    // Print an embed with players in queue
    const queue = QueueManager.findQueueByName(queueName);

    if (!queue) {
      return interaction.reply({
        content: `There is no queue with name ${queueName}`,
        ephemeral: true,
      });
    }

    const embed = buildInfoEmbed(
      `Queue ${queueName}`,
      `**Players:**
${queue.players.join("\n")}`
    );

    return interaction.reply({ embeds: [embed] });
  },
};
