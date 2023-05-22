const { SlashCommandBuilder, ActionRowBuilder } = require("discord.js");
const { buildMapBanEmbed } = require("../../embeds");
const { buildMapBanMenu } = require("../../menus");
const GameManager = require("../../game/GameManager");

async function handlePickPhaseEnd(interaction, game) {
  const unassignedPlayers = game.getTeamlessPlayers();

  let current = "B";
  while (unassignedPlayers.length > 0) {
    game.assignPlayerToTeam(unassignedPlayers[0], current);
    unassignedPlayers.splice(0, 1);
    current = current === "A" ? "B" : "A";
  }

  await interaction.reply({ embeds: [game.createEmbed()] });

  return interaction.followUp({
    embeds: [buildMapBanEmbed(game.captainA)],
    components: [new ActionRowBuilder().addComponents(buildMapBanMenu("a"))],
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pick")
    .setDescription("Pick a player for your team")
    .addUserOption((option) =>
      option.setName("name").setDescription("Discord account").setRequired(true)
    ),
  async execute(interaction) {
    const member = interaction.member;
    const mentionedUser = interaction.options.getUser("name");

    if (!mentionedUser) {
      return interaction.reply({
        content: "This user does not exist",
        ephemeral: true,
      });
    }

    const mentionedMember = await interaction.guild.members.fetch(
      mentionedUser.id
    );

    if (!interaction.channel.name.startsWith("game-")) {
      return interaction.reply({
        content: "This command can only be issued in a game channel",
        ephemeral: true,
      });
    }

    // Which game is this player in?
    const game = GameManager.findGameByPlayer(member);

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

    if (game.state === "pick-a" && member !== game.captainA) {
      return interaction.reply({
        content: "Captain A has to pick first!",
        ephemeral: true,
      });
    }

    if (game.state === "pick-b" && member !== game.captainB) {
      return interaction.reply({
        content: "Captain B has to pick now!",
        ephemeral: true,
      });
    }

    const pickedPlayer = mentionedMember;

    if (!game.players.includes(pickedPlayer)) {
      return interaction.reply({
        content: "This player is not in your game",
        ephemeral: true,
      });
    }

    if (pickedPlayer === member) {
      return interaction.reply({
        content: "You cannot pick yourself, dummy!",
        ephemeral: true,
      });
    }

    if (
      game.teamA.includes(pickedPlayer) ||
      game.teamB.includes(pickedPlayer)
    ) {
      return interaction.reply({
        content: `This player is already assigned to team ${pickedPlayer.team}`,
        ephemeral: true,
      });
    }

    if (game.state === "pick-a") {
      game.assignPlayerToTeam(pickedPlayer, "A");
      game.state = "pick-b";

      // If there is only one player left, assign them to B directly
      const teamlessPlayers = game.getTeamlessPlayers();
      if (teamlessPlayers.length === 1) {
        game.state = "map-ban-a";
        return handlePickPhaseEnd(interaction, game);
      }

      return interaction.reply({ embeds: [game.createEmbed()] });
    } else {
      game.assignPlayerToTeam(pickedPlayer, "B");
      game.state = "map-ban-a";

      return handlePickPhaseEnd(interaction, game);
    }
  },
};
