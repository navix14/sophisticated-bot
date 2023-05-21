const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
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

    if (
      interaction.channel.name.toLowerCase() !== "info" &&
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "This command can only be issued in the #info channel",
        ephemeral: true,
      });
    }

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

    let winRate = 0;
    if (user.wins + user.losses !== 0) {
      winRate = Math.round((user.wins / (user.wins + user.losses)) * 100);
    }

    return interaction.reply({
      embeds: [
        buildInfoEmbed(
          "Player Info",
          `**Player name:** [${player.name}](https://xero.gg/player/${playerName})
**Clan:** ${clan}
**Level:** ${player.level}

**Points:** ${user.points}
**Wins:** ${user.wins}
**Losses:** ${user.losses}
**Win rate:** ${winRate}%
`,
          player.imageUrl
        ),
      ],
    });
  },
};
