const { SlashCommandBuilder } = require("discord.js");
const { GameManager } = require("../../game");
const { UserModel } = require("../../db");
const ChannelManager = require("../../channelManager");

function clampPoints(points) {
  return points < 100 ? 100 : points;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dodge")
    .setDescription("Leave an active ranked game"),
  async execute(interaction) {
    if (!interaction.channel.name.startsWith("game-")) {
      return interaction.reply({
        content: "This command can only be issued in a game channel",
        ephemeral: true,
      });
    }

    const game = GameManager.findGameByPlayer(interaction.member);

    if (!game) {
      return interaction.reply({
        content: "You are currently not in a ranked game.",
        ephemeral: "true",
      });
    }

    // If player dodges a game, the game is deleted and its channel removed
    GameManager.removeGame(game);

    interaction.reply({
      content:
        "You motherfucker! You dodged the channel and now nobody can play...",
    });

    // Ban player for 30 minutes, subtract 200 points
    const user = await UserModel.findOne({
      where: { discordName: interaction.user.tag },
    });

    const now = new Date();
    const future = new Date(now.getTime() + 30 * 60000);

    await user.update({
      bannedUntil: future,
      points: clampPoints(user.points - 200),
    });

    try {
      await interaction.member.setNickname(
        `${user.ingameName} [${clampPoints(user.points - 200)}]`
      );
    } catch (err) {
      console.log(err);
    }

    // Post in #bans channel
    const bansChannel = ChannelManager.findByName("bans");

    await bansChannel.send(
      `${interaction.member} has been banned until ${future.toLocaleString()}`
    );

    setTimeout(() => {
      interaction.channel.delete();
    }, 5000);
  },
};
