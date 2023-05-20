const buildInfoEmbed = require("../embeds/infoEmbed");
const { mapPool } = require("../config.json");

class RankedGame {
  constructor(gameInfo) {
    this.gameId = gameInfo.gameId;
    this.channel = gameInfo.channel;
    this.players = gameInfo.players;
    this.teamA = [];
    this.teamB = [];
    this.mapPool = [...mapPool];
    this.bannedMaps = [];
    this.map = "";

    this.hasVoted = [];
    this.votesA = 0;
    this.votesB = 0;
    this.result = "";

    this.state = "pick-a";
  }

  banMap(mapName) {
    if (this.bannedMaps.includes(mapName)) {
      return false;
    }

    const index = this.mapPool.findIndex((map) => map.mapName === mapName);
    this.mapPool.splice(index, 1);
    this.bannedMaps.push(mapName);

    return true;
  }

  playerHasVoted(player) {
    return this.hasVoted.includes(player);
  }

  getTeamlessPlayers() {
    return this.players.filter(
      (p) => !this.teamA.includes(p) && !this.teamB.includes(p)
    );
  }

  setResult(winner) {
    this.result = winner;
  }

  makeVote(player, team) {
    if (team === "a") {
      this.votesA++;
    } else {
      this.votesB++;
    }

    this.hasVoted.push(player);
  }

  setCaptainA(player) {
    this.teamA.push(player);
    this.captainA = player;
  }

  setCaptainB(player) {
    this.teamB.push(player);
    this.captainB = player;
  }

  assignPlayerToTeam(player, team) {
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
          `Game ${this.gameId} (V${this.players.length / 2} Queue)`,
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
          `Game ${this.gameId} (V${this.players.length / 2} Queue)`,
          `Start picking!
      
**Team A:**
Captain: ${this.captainA}
${playersA}

**Team B:**
Captain: ${this.captainB}

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
