const { UserModel, GameModel } = require("../db");

class GameManager {
  constructor() {
    this.games = [];
    this.nextGameId = 1;
  }

  init(nextId) {
    this.nextGameId = nextId;
  }

  addGame(game) {
    this.games.push(game);
    this.nextGameId++;
  }

  removeGame(game) {
    const index = this.games.indexOf(game);

    if (index >= 0) {
      this.games.splice(index, 1);
    }
  }

  isPlayerInGame(player) {
    return this.findGameByPlayer(player) !== undefined;
  }

  findGameById(id) {
    return this.games.find((game) => game.gameId === id);
  }

  findGameByChannel(channel) {
    return this.games.find((game) => game.channel === channel);
  }

  findGameByPlayer(player) {
    return this.games.find((game) => game.players.includes(player));
  }

  findGameByTag(tag) {
    return this.games.find((game) =>
      game.players.some((p) => p.user.tag === tag)
    );
  }

  findGamesByPlayerLimit(playerLimit) {
    return this.games.filter((game) => game.players.length === playerLimit);
  }

  async persist(game) {
    // Store game in database
    const teamAUsers = [];
    const teamBUsers = [];

    const captainAUser = await UserModel.findOne({
      where: { discordName: game.captainA.user.tag },
    });

    const captainBUser = await UserModel.findOne({
      where: { discordName: game.captainB.user.tag },
    });

    for (const member of game.teamA) {
      const user = await UserModel.findOne({
        where: { discordName: member.user.tag },
      });
      teamAUsers.push(user);
    }

    for (const member of game.teamB) {
      const user = await UserModel.findOne({
        where: { discordName: member.user.tag },
      });
      teamBUsers.push(user);
    }

    // Create a new game instance
    const rankedGame = await GameModel.create({
      captainAId: captainAUser.id,
      captainBId: captainBUser.id,
      result: game.result,
    });

    // Save participants
    for (const user of teamAUsers) {
      await user.addGame(rankedGame, { through: { team: "A" } });
    }

    for (const user of teamBUsers) {
      await user.addGame(rankedGame, { through: { team: "B" } });
    }
  }
}

module.exports = new GameManager();
