const { SlashCommandBuilder } = require("discord.js");
const Users = require("../../db/userModel");
const buildPlayerEditModal = require("../../modals/editPlayerModal");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("edit_stats")
    .setDescription("Edit a player's stats manually")
    .addUserOption((option) =>
      option
        .setName("discord_name")
        .setDescription("Discord ID")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    const discordUser = interaction.options.getUser("discord_name");
    const discordName = `${discordUser.username}#${discordUser.discriminator}`;

    const player = await Users.findOne({
      where: { discord_name: discordName },
    });

    if (player === null) {
      return interaction.reply({
        content: `${discordUser} is not registered yet.`,
        ephemeral: true,
      });
    }

    // Show modal to edit stats
    return interaction.showModal(buildPlayerEditModal(player));
  },
};
