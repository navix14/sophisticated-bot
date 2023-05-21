const { EmbedBuilder, Colors } = require("discord.js");

function buildResultsEmbed(game, winners, losers, increment) {
  const embed = new EmbedBuilder()
    .setColor(Colors.Blue)
    .setTitle(`Game ${game.gameId} Results`).setDescription(`**Map:** ${
    game.map.mapName
  }
    
**Winning Team:**
${winners.map((player) => `${player} +${increment} points`).join("\n")}

**Losing Team:**
${losers.map((player) => `${player} -${increment} points`).join("\n")}
`);

  return embed;
}

module.exports = buildResultsEmbed;
