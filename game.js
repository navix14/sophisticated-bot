const buildInfoEmbed = require("./embeds/infoEmbed");

class RankedGame {
  constructor(gameInfo) {
    this.gameId = gameInfo.gameId;
    this.channel = gameInfo.channel;
    this.players = gameInfo.players;
    this.teamA = [];
    this.teamB = [];
    this.state = "pick-a";
  }

  setCaptainA(player) {
    player.team = "A";
    this.teamA.push(player);
    this.captainA = player;
  }

  setCaptainB(player) {
    player.team = "B";
    this.teamB.push(player);
    this.captainB = player;
  }

  assignPlayerToTeam(player, team) {
    player.team = team;

    if (team === "A") {
      this.teamA.push(player);
    } else {
      this.teamB.push(player);
    }
  }

  createEmbed() {
    const remainingPlayers = this.players.filter(
      (p) => !this.teamA.includes(p) && !this.teamB.includes(p)
    );

    const remainingPlayersString = remainingPlayers
      .map((p) => `${p}`)
      .join("\n");

    const playersA = this.teamA
      .filter((p) => p !== this.captainA)
      .map((p) => `${p}`)
      .join("\n");

    const playersB = this.teamB
      .filter((p) => p !== this.captainB)
      .map((p) => `${p}`)
      .join("\n");

    switch (this.state) {
      case "pick-a":
        return buildInfoEmbed(
          `Game ${this.gameId} (V3 Queue)`,
          `Start picking!

**Team A:**
Captain: ${this.captainA}

**Team B:**
Captain: ${this.captainB}

**Remaining players:**
${remainingPlayersString}

**Current pick:**
${this.captainA}

${this.captainA} Use the \`/pick\` command to pick 1 player!
`
        );
      case "pick-b":
        return buildInfoEmbed(
          `Game ${this.gameId} (V3 Queue)`,
          `Start picking!
      
**Team 1:**
Captain: ${this.captainA}
${playersA}

**Team 2:**
Captain: ${this.captainB}
${playersB}

**Remaining players:**
${remainingPlayersString}

**Current pick:**
${this.captainB}

${this.captainB} Use the \`/pick\` command to pick 1 player!
`
        );
      case "map-ban-a":
        return buildInfoEmbed(
          `Game ${this.gameId} final teams!`,
          `
**Team 1:**
${this.captainA}
${playersA}

**Team 2:**
${this.captainB}
${playersB}
`
        );
      default:
        return "Error";
    }
  }
}

module.exports = RankedGame;
