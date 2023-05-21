const buildInfoEmbed = require("./infoEmbed");

function buildGameSummaryEmbed(game) {
  const embed = buildInfoEmbed(
    "Ready to play",
    `Matchmaking is over!
      
    **Team A:**
    ${game.teamA.join("\n")}
    
    **Team B:**
    ${game.teamB.join("\n")}
    
    **Map:** ${game.map.mapName}
    
    **Once the game is over, use the \`/vote\` command to select the winner.
    
    Use \`/vote A\` to vote for team A and \`/vote B\` to vote for team B.**`,
    null,
    game.map.mapImage
  );

  return embed;
}

module.exports = buildGameSummaryEmbed;
