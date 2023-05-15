const Users = require("../../db/userModel");
const XeroClient = require("../../xero-api/xeroClient");
const { SlashCommandBuilder } = require("discord.js");
const { buildErrorEmbed, buildCooldownEmbed } = require("../../embeds");

const xeroClient = new XeroClient();

async function renameUser(interaction, xeroName) {
  await interaction.member.setNickname(xeroName);
  return interaction.reply(
    `${interaction.user} has been linked to '${xeroName}'`
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription(
      "Register your Discord account with your ingame Xero account"
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Your ingame Xero name")
        .setRequired(true)
    ),
  async execute(interaction) {
    const xeroName = interaction.options.getString("name");
    const discordName = `${interaction.user.username}#${interaction.user.discriminator}`;

    // Check if Xero account exists
    if (!(await xeroClient.playerExists(xeroName))) {
      return interaction.reply({
        embeds: [
          buildErrorEmbed(
            "Failed to link",
            `Player **${xeroName}** does not exist on xero.gg`
          ),
        ],
      });
    }

    const existingUser = await Users.findOne({
      where: { ingame_name: xeroName },
    });

    if (existingUser && existingUser.discord_name !== discordName) {
      return interaction.reply({
        embeds: [
          buildErrorEmbed(
            "Failed to link",
            `**${existingUser.discord_name}** is already linked to **${xeroName}**`
          ),
        ],
      });
    }

    const user = await Users.findOne({ where: { discord_name: discordName } });

    // If user is already registered, check if re-link is allowed
    if (user) {
      const lastLinkDate = user.last_link;
      const nextLinkDate = new Date(lastLinkDate);
      nextLinkDate.setDate(lastLinkDate.getDate() + 2);

      const currentDate = new Date();

      // Re-link is possible again
      if (currentDate > nextLinkDate) {
        await Users.update(
          { ingame_name: xeroName, last_link: currentDate },
          { where: { discord_name: discordName } }
        );

        renameUser(interaction, xeroName);
      } else {
        return interaction.reply({
          embeds: [buildCooldownEmbed(user.ingame_name, nextLinkDate)],
        });
      }
    } else {
      // First link is always possible
      await Users.create({
        discord_name: discordName,
        ingame_name: xeroName,
        last_link: new Date(),
      });

      renameUser(interaction, xeroName);
    }
  },
};
