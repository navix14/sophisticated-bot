const XeroClient = require("../../xero-api/xeroClient");
const { SlashCommandBuilder } = require("discord.js");
const { buildErrorEmbed, buildCooldownEmbed } = require("../../embeds");
const UserModel = require("../../db/userModel");

const xeroClient = new XeroClient();

async function renameUser(interaction, xeroName) {
  try {
    await interaction.member.setNickname(`${xeroName} [100]`);
  } catch (err) {
    console.log(err);
  }

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
    const discordName = interaction.user.tag;

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

    const existingUser = await UserModel.findOne({
      where: { ingameName: xeroName },
    });

    if (existingUser && existingUser.discordName !== discordName) {
      return interaction.reply({
        embeds: [
          buildErrorEmbed(
            "Failed to link",
            `**${existingUser.discordName}** is already linked to **${xeroName}**`
          ),
        ],
      });
    }

    const user = await UserModel.findOne({
      where: { discordName: discordName },
    });

    // If user is already registered, check if re-link is allowed
    if (user) {
      const lastLinkDate = user.lastLink;
      const nextLinkDate = new Date(lastLinkDate);
      nextLinkDate.setDate(lastLinkDate.getDate() + 2);

      const currentDate = new Date();

      // Re-link is possible again
      if (currentDate > nextLinkDate) {
        await UserModel.update(
          { ingameName: xeroName, lastLink: currentDate },
          { where: { discordName: discordName } }
        );

        renameUser(interaction, xeroName);
      } else {
        return interaction.reply({
          embeds: [buildCooldownEmbed(user.ingameName, nextLinkDate)],
        });
      }
    } else {
      // First link is always possible
      await UserModel.create({
        discordName: discordName,
        ingameName: xeroName,
        lastLink: new Date(),
      });

      renameUser(interaction, xeroName);
    }
  },
};
