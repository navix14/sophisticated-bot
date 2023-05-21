const { SlashCommandBuilder } = require("discord.js");
const UserModel = require("../../db/userModel");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban_ranked")
    .setDescription("Un-Ban player from ranked queues")
    .addUserOption((option) =>
      option.setName("user").setDescription("Player").setRequired(true)
    )
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    const user = interaction.options.getUser("user");

    if (!user) {
      return interaction.reply({
        content: "User does not exist",
        ephemeral: true,
      });
    }

    await UserModel.update(
      { bannedUntil: new Date(0) },
      { where: { discordName: user.tag } }
    );

    return interaction.reply({
      content: `${user} has been unbanned`,
      ephemeral: true,
    });
  },
};
