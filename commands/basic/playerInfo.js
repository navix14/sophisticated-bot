const { SlashCommandBuilder } = require("discord.js");
const XeroClient = require("../../xero-api/xeroClient");
const buildInfoEmbed = require("../../embeds/infoEmbed");

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

    let clanString = `[${player.clan}](https://xero.gg/clan/${player.clan})`;
    if (!player.clan) {
      clanString = "Player is not in a clan";
    }

    return interaction.reply({
      embeds: [
        buildInfoEmbed(
          "Player Info",
          `**Player name:** [${player.name}](https://xero.gg/player/${playerName})
**Clan:** ${clanString}
**Level:** ${player.level}`,
          player.imageUrl
        ),
      ],
    });
  },
};
