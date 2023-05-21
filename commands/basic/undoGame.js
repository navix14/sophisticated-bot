const { SlashCommandBuilder } = require("discord.js");
const { GameModel, UserModel } = require("../../db");

function clampPoints(newPoints) {
  return newPoints < 100 ? 100 : newPoints;
}

function clampWinsLoses(newValue) {
  return newValue < 0 ? 0 : newValue;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("undo_game")
    .setDescription("Undos a ranked game")
    .addIntegerOption((option) =>
      option
        .setName("game_id")
        .setDescription("The ID of the game")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    const gameId = interaction.options.getInteger("game_id");

    // Get game from database
    const game = await GameModel.findByPk(gameId, {
      include: [
        { model: UserModel },
        { model: UserModel, as: "captainA" },
        { model: UserModel, as: "captainB" },
      ],
    });

    if (!game) {
      return interaction.reply({
        content: `Game with ID ${gameId} does not exist`,
        ephemeral: true,
      });
    }

    if (game.wasUndone) {
      return interaction.reply({
        content: `Game with ID ${gameId} has been resetted already`,
        ephemeral: true,
      });
    }

    const playersA = game.users.filter((u) => u.participant.team === "A");
    const playersB = game.users.filter((u) => u.participant.team === "B");

    const winners = game.result === "A" ? [...playersA] : [...playersB];
    const losers = game.result === "A" ? [...playersB] : [...playersA];

    await interaction.guild.members.fetch();

    // Deduct points from winners
    for (const user of winners) {
      await user.update({
        points: clampPoints(user.points - game.incrementPoints),
        wins: clampWinsLoses(user.wins - 1),
      });

      try {
        const member = interaction.guild.members.cache.find(
          (m) => m.user.tag === user.discordName
        );

        await member.setNickname(`${user.ingameName} [${user.points}]`);
      } catch (err) {
        console.log(err);
      }
    }

    for (const user of losers) {
      await user.update({
        points: clampPoints(user.points + game.incrementPoints),
        losses: clampWinsLoses(user.losses - 1),
      });

      try {
        const member = interaction.guild.members.cache.find(
          (m) => m.user.tag === user.discordName
        );
        await member.setNickname(`${user.ingameName} [${user.points}]`);
      } catch (err) {
        console.log(err);
      }
    }

    await game.update({ wasUndone: 1 });

    return interaction.reply({
      content: `Game ${gameId} has been undone. Players ELOs were resetted.`,
    });
  },
};
