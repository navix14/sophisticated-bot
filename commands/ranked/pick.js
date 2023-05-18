const { SlashCommandBuilder } = require("discord.js");

function handlePickPhaseEnd(interaction, game) {
  const unassignedPlayers = game.players.filter(
    (p) => !Object.hasOwn(p, "team")
  );

  game.assignPlayerToTeam(unassignedPlayers[0], "A");
  game.assignPlayerToTeam(unassignedPlayers[1], "B");

  return interaction.reply({ embeds: [game.createEmbed()] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pick")
    .setDescription("Pick a player for your team")
    .addUserOption((option) =>
      option.setName("name").setDescription("Discord account").setRequired(true)
    ),
  async execute(interaction) {
    const mentionedUser = interaction.options.getUser("name");
    const mentionedMember = await interaction.guild.members.fetch(
      mentionedUser.id
    );

    if (!interaction.channel.name.startsWith("game-")) {
      return interaction.reply({
        content: "This command can only be issued in a game channel",
        ephemeral: true,
      });
    }

    const game = interaction.activeGames.find((g) =>
      g.players.includes(interaction.member)
    );

    if (!game) {
      return interaction.reply({
        content: "You are currently not in a ranked game.",
        ephemeral: "true",
      });
    }

    if (game.state !== "pick-a" && game.state !== "pick-b") {
      return interaction.reply({
        content: "Picking phase is over!",
        ephemeral: true,
      });
    }

    if (game.state === "pick-a" && interaction.member !== game.captainA) {
      return interaction.reply({
        content: "Captain A has to pick first!",
        ephemeral: true,
      });
    }

    if (game.state === "pick-b" && interaction.member !== game.captainB) {
      return interaction.reply({
        content: "Captain B has to pick now!",
        ephemeral: true,
      });
    }

    const pickedPlayer = game.players.find((p) => p === mentionedMember);

    if (!pickedPlayer) {
      return interaction.reply({
        content: "This player is not in your game",
        ephemeral: true,
      });
    }

    if (pickedPlayer === interaction.member) {
      return interaction.reply({
        content: "You cannot pick yourself, dummy!",
        ephemeral: true,
      });
    }

    if (Object.hasOwn(pickedPlayer, "team")) {
      return interaction.reply({
        content: `This player is already assigned to team ${pickedPlayer.team}`,
        ephemeral: true,
      });
    }

    if (game.state === "pick-a") {
      game.assignPlayerToTeam(pickedPlayer, "A");
      game.state = "pick-b";

      return interaction.reply({ embeds: [game.createEmbed()] });
    }

    if (game.state == "pick-b") {
      game.assignPlayerToTeam(pickedPlayer, "B");
      game.state = "map-ban-a";

      return handlePickPhaseEnd(interaction, game);
    }
  },
};
