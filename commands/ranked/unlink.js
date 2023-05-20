const { SlashCommandBuilder } = require("discord.js");
const { buildInfoEmbed } = require("../../embeds");
const UserModel = require("../../db/userModel");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlink")
    .setDescription("Unlink discord account from Xero")
    .addUserOption((option) =>
      option.setName("name").setDescription("Discord account").setRequired(true)
    )
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    const account = interaction.options.getUser("name");

    // Check if account exists in database
    const user = await UserModel.findOne({
      where: { discordName: account.tag },
    });

    if (!user) {
      return interaction.reply({
        embeds: [
          buildInfoEmbed(
            "User not linked",
            `${account} is not linked to any Xero account yet.`
          ),
        ],
      });
    }

    // Unlink account
    await UserModel.destroy({ where: { discordName: account.tag } });

    return interaction.reply({
      embeds: [
        buildInfoEmbed("User unlinked", `${account} has been unlinked.`),
      ],
    });
  },
};
