const Users = require("../../db/userModel");
const { SlashCommandBuilder } = require("discord.js");
const { buildInfoEmbed } = require("../../embeds");

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
    const discordName = `${account.username}#${account.discriminator}`;

    // Check if account exists in database
    const user = await Users.findOne({ where: { discord_name: discordName } });

    if (user === null) {
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
    await Users.destroy({ where: { discord_name: discordName } });

    return interaction.reply({
      embeds: [
        buildInfoEmbed("User unlinked", `${account} has been unlinked.`),
      ],
    });
  },
};
