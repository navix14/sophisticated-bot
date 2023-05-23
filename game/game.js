const { mapPool } = require("../config.json");
const { buildInfoEmbed } = require("../embeds");

function buildPickEmbed(game) {
  const teamAPlayers = game.teamA.filter((p) => p !== game.captainA).join("\n");
  const teamBPlayers = game.teamB.filter((p) => p !== game.captainB).join("\n");

  const currentPick = game.state === "pick-a" ? game.captainA : game.captainB;
  const explanation =
    game.state === "pick-a"
      ? `${currentPick} Use the \`=p\` command to pick 1 player!`
      : `${currentPick} Use the \`=p\` command to pick 2 players!`;

  return buildInfoEmbed(
    `Game ${game.gameId} (V${game.players.length / 2} Queue)`,
    `Start picking!

**Team A:**
Captain: ${game.captainA}
${teamAPlayers}

**Team B:**
Captain: ${game.captainB}
${teamBPlayers}

**Remaining players:**
${game.getTeamlessPlayers().join("\n")}

**Current pick:**
${currentPick}

${explanation}
`
  );
}

function buildFinalTeamsEmbed(game) {
  const teamAPlayers = game.teamA.filter((p) => p !== game.captainA).join("\n");
  const teamBPlayers = game.teamB.filter((p) => p !== game.captainB).join("\n");

  return buildInfoEmbed(
    `Game ${game.gameId} final teams!`,
    `**Team 1:**
Captain: ${game.captainA}
${teamAPlayers}

**Team 2:**
Captain: ${game.captainB}
${teamBPlayers}`
  );
}

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

  contains(player) {
    return this.players.includes(player);
  }

  playerHasTeam(player) {
    return this.teamA.includes(player) || this.teamB.includes(player);
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
    switch (this.state) {
      case "pick-a":
      case "pick-b":
      case "pick-b2":
        return buildPickEmbed(this);
      case "map-ban-a":
        return buildFinalTeamsEmbed(this);
      default:
        return "Error";
    }
  }
}

module.exports = RankedGame;
