const { SlashCommandBuilder } = require("discord.js");
const { buildPlayerEditModal } = require("../../modals");
const UserModel = require("../../db/userModel");

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
    const member = interaction.options.getUser("discord_name");

    if (!member) {
      return interaction.reply({
        content: "User does not exist",
        ephemeral: true,
      });
    }

    const player = await UserModel.findOne({
      where: { discordName: member.tag },
    });

    if (!player) {
      return interaction.reply({
        content: `${member} is not registered yet.`,
        ephemeral: true,
      });
    }

    // Show modal to edit stats
    return interaction.showModal(buildPlayerEditModal(player));
  },
};
