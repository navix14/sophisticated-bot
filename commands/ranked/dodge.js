const { SlashCommandBuilder } = require("discord.js");

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

    const game = interaction.activeGames.find((g) =>
      g.players.includes(interaction.member)
    );

    if (!game) {
      return interaction.reply({
        content: "You are currently not in a ranked game.",
        ephemeral: "true",
      });
    }

    // If player dodges a game, the game is deleted and its channel removed
    const index = interaction.activeGames.indexOf(game);
    interaction.activeGames.splice(index, 1);

    const reply = interaction.channel.send({
      content:
        "You motherfucker! You dodged the channel and now nobody can play...",
    });

    setTimeout(() => {
      interaction.channel.delete();
    }, 5000);

    return reply;
  },
};
