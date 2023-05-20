const { SlashCommandBuilder } = require("discord.js");
const UserModel = require("../../db/userModel");

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

    try {
      await UserModel.create({
        discordName: discordUser.tag,
        ingameName: xeroName,
        lastLink: new Date(),
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        await UserModel.update(
          { ingameName: xeroName, lastLink: new Date() },
          { where: { discordName: discordUser.tag } }
        );
      }
    }

    const user = await UserModel.findOne({ where: { ingameName: xeroName } });
    const points = user ? user.points : "100";

    try {
      await member.setNickname(`${xeroName} [${points}]`);
    } catch (err) {
      console.log(err);
    }

    await interaction.reply({
      content: `${member} force-linked to '${xeroName}'`,
    });
  },
};
