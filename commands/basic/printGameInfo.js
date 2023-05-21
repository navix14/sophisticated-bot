const { SlashCommandBuilder } = require("discord.js");
const { GameModel, UserModel } = require("../../db");
const { buildInfoEmbed } = require("../../embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("game_info")
    .setDescription("Print info about a finished ranked game")
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
        content: `Game with ${gameId} does not exist`,
        ephemeral: true,
      });
    }

    const captainA = game.captainA;
    const captainB = game.captainB;

    const playersA = game.users.filter((u) => u.participant.team === "A");
    const playersB = game.users.filter((u) => u.participant.team === "B");

    const embed = buildInfoEmbed(
      `Game ${gameId} info ${game.wasUndone ? "(Undone)" : ""}`,
      `**Team A:**
${playersA
  .map(
    (u) =>
      u.ingameName + (u.ingameName === captainA.ingameName ? " (Captain)" : "")
  )
  .join("\n")}
  
**Team B:**
${playersB
  .map(
    (u) =>
      u.ingameName + (u.ingameName === captainB.ingameName ? " (Captain)" : "")
  )
  .join("\n")}
  
**Map:** ${game.map}
**Winner:** Team ${game.result}
**Points won/lost:** ${game.incrementPoints}
  `
    );

    return interaction.reply({ embeds: [embed] });
  },
};
