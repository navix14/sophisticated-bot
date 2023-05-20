const { SlashCommandBuilder } = require("discord.js");
const XeroClient = require("../../xero-api/xeroClient");
const buildInfoEmbed = require("../../embeds/infoEmbed");
const UserModel = require("../../db/userModel");

const xeroClient = new XeroClient();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("player_info")
    .setDescription("Fetch player info from xero.gg")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Xero player name")
        .setRequired(true)
    ),
  async execute(interaction) {
    const playerName = interaction.options.getString("name");
    const player = await xeroClient.fetchPlayer(playerName);

    if (!player) {
      return interaction.reply(`Player ${playerName} does not exist`);
    }

    // Merge with player info from database
    const user = (await UserModel.findOne({
      where: { ingameName: playerName },
    })) || {
      points: "User is not registered",
      wins: "User is not registered",
      losses: "User is not registered",
    };

    const clan = player.clan
      ? `[${player.clan}](https://xero.gg/clan/${encodeURIComponent(
          player.clan
        )})`
      : "Player is not in a clan";

    return interaction.reply({
      embeds: [
        buildInfoEmbed(
          "Player Info",
          `**Player name:** [${
            player.name
          }](https://xero.gg/player/${playerName})
**Clan:** ${clan}
**Level:** ${player.level}

**Points:** ${user.points}
**Wins:** ${user.wins}
**Losses:** ${user.losses}
**W/L ratio:** ${user.losses ? user.wins / user.losses : "0"}
`,
          player.imageUrl
        ),
      ],
    });
  },
};
