const { SlashCommandBuilder } = require("discord.js");
const Users = require("../../db/queue-api");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("force_link")
    .setDescription("Force link user with Xero account")
    .addUserOption((option) =>
      option
        .setName("discord_name")
        .setDescription("Discord ID")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Ingame Xero name")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    const discordUser = interaction.options.getUser("discord_name");
    const xeroName = interaction.options.getString("name");

    const member = await interaction.guild.members.fetch(discordUser.id);
    const discordName = `${member.user.username}#${member.user.discriminator}`;

    try {
      await Users.create({
        discord_name: discordName,
        ingame_name: xeroName,
        last_link: new Date(),
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        await Users.update(
          { ingame_name: xeroName, last_link: new Date() },
          { where: { discord_name: discordName } }
        );
      }
    }

    await member.setNickname(xeroName);

    await interaction.reply({
      content: `${discordUser} force-linked to '${xeroName}'`,
    });
  },
};
