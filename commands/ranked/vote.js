const { SlashCommandBuilder } = require("discord.js");
const { GameManager } = require("../../game");
const { UserModel } = require("../../db");
const ChannelManager = require("../../channelManager");
const buildResultsEmbed = require("../../embeds/resultsEmbed");

async function updateElo(game) {
  // Update elo of all winners
  const winningPlayers = game.result === "A" ? game.teamA : game.teamB;
  const losingPlayers = game.result === "A" ? game.teamB : game.teamA;

  // Fetch players from DB
  const winningUsers = [];
  const losingUsers = [];

  for (const player of winningPlayers) {
    const user = await UserModel.findOne({
      where: { discordName: player.user.tag },
    });
    winningUsers.push(user);
  }

  for (const player of losingPlayers) {
    const user = await UserModel.findOne({
      where: { discordName: player.user.tag },
    });
    losingUsers.push(user);
  }

  const increment = Math.ceil(
    losingUsers.reduce((acc, curr) => acc + curr.points, 0) * 0.1
  );

  for (let i = 0; i < winningPlayers.length; i++) {
    const user = winningUsers[i];
    const member = winningPlayers[i];

    const newPoints = user.points + increment;

    await user.update({ points: newPoints, wins: user.wins + 1 });

    try {
      await member.setNickname(`${user.ingameName} [${newPoints}]`);
    } catch (err) {
      console.log(err);
    }
  }

  for (let i = 0; i < losingPlayers.length; i++) {
    const user = losingUsers[i];
    const member = losingPlayers[i];

    let newPoints = user.points - increment;

    if (newPoints < 100) {
      newPoints = 100;
    }

    await user.update({ points: newPoints, losses: user.losses + 1 });

    try {
      await member.setNickname(`${user.ingameName} [${newPoints}]`);
    } catch (err) {
      console.log(err);
    }
  }

  // Persist game in DB
  await GameManager.persist(game);

  // Post result in results channel
  const resultsChannel = ChannelManager.findByName("results");

  const resultsEmbed = buildResultsEmbed(
    game,
    winningPlayers,
    losingPlayers,
    increment
  );

  resultsChannel.send({ embeds: [resultsEmbed] });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Vote for the winner team of a game")
    .addStringOption((option) =>
      option
        .setName("team")
        .setDescription("Choose the team you want to vote for")
        .setRequired(true)
    ),
  async execute(interaction) {
    const vote = interaction.options.getString("team").toLowerCase();

    if (!interaction.channel.name.startsWith("game-")) {
      return interaction.reply({
        content: "This command can only be issued in a game channel",
        ephemeral: true,
      });
    }

    const game = GameManager.findGameByPlayer(interaction.member);

    if (!game) {
      return interaction.reply({
        content: "You are currently not in a ranked game.",
        ephemeral: "true",
      });
    }

    if (game.state !== "wait-for-result") {
      return interaction.reply({
        content: "Matchmaking is not over yet",
        ephemeral: true,
      });
    }

    if (vote !== "a" && vote !== "b") {
      return interaction.reply({
        content: "You can only vote for team A or B",
        ephemeral: true,
      });
    }

    if (game.playerHasVoted(interaction.member)) {
      return interaction.reply({
        content: "You have already voted",
        ephemeral: true,
      });
    }

    game.makeVote(interaction.member, vote);

    interaction.reply(`${
      interaction.member
    } has voted for team ${vote.toUpperCase()}
**Team A:** ${game.votesA}, **Team B:** ${game.votesB}`);

    if (game.votesA > game.players.length / 2) {
      interaction.channel.send(
        `Congratulations ${game.teamA.join(" ")}! Team A has won the game.`
      );

      GameManager.removeGame(game);

      // Update ELO
      game.setResult("A");
      updateElo(game);

      setTimeout(() => {
        interaction.channel.delete();
      }, 5000);
    } else if (game.votesB > game.players.length / 2) {
      interaction.channel.send(
        `Congratulations ${game.teamB.join(" ")}! Team B has won the game.`
      );

      GameManager.removeGame(game);

      // Update ELO
      game.setResult("B");
      updateElo(game);

      setTimeout(() => {
        interaction.channel.delete();
      }, 5000);
    }
  },
};
