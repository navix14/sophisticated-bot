const {
  Client,
  Events,
  GatewayIntentBits,
  ChannelType,
  ActionRowBuilder,
  PermissionsBitField,
} = require("discord.js");
const {
  token,
  mapPool,
  gameCategory,
  queues,
  guildId,
} = require("./config.json");
const { registerCommands } = require("./registerCommands");
const { UserModel, GameModel, ParticipantModel } = require("./db");
const { extractString } = require("./utils");
const { buildMapBanEmbed, buildGameSummaryEmbed } = require("./embeds");
const { buildMapBanMenu } = require("./menus");
const { Queue, RankedGame, QueueManager, GameManager } = require("./game");
const { Sequelize } = require("sequelize");
const ChannelManager = require("./channelManager");

async function createGame(interaction, players) {
  const gameId = GameManager.nextGameId;

  const allowPerms = players.map((p) => ({
    id: p.user.id,
    allow: [PermissionsBitField.Flags.SendMessages],
  }));

  const gameChannel = await interaction.guild.channels.create({
    name: `game-${gameId}`,
    type: ChannelType.GuildText,
    parent: ChannelManager.findByName(gameCategory),
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.SendMessages],
      },
      ...allowPerms,
    ],
  });

  const game = new RankedGame({
    gameId: gameId,
    channel: gameChannel,
    players: players,
  });

  // Shuffle players array
  const playersShuffled = players.sort(() => 0.5 - Math.random());

  // Pick captains
  game.setCaptainA(playersShuffled[0]);
  game.setCaptainB(playersShuffled[1]);

  GameManager.addGame(game);

  await gameChannel.send(`${playersShuffled.join(" ")}
Captains have been chosen!

Captain A: **${game.captainA}**
Captain B: **${game.captainB}**`);

  await gameChannel.send({ embeds: [game.createEmbed()] });
}

async function handleQueueJoin(interaction, queue) {
  const member = interaction.member;

  // Check if member is already in any queue
  if (QueueManager.isMemberInQueue(member)) {
    const existingQueue = QueueManager.findQueueByPlayer(member);

    return interaction.reply({
      content: `You are in a queue already. (${existingQueue.channel})`,
      ephemeral: true,
    });
  }

  const user = await UserModel.findOne({
    where: { discordName: member.user.tag },
  });

  // Check if user is linked
  if (!user) {
    return interaction.reply({
      content:
        "You have to link your Xero account first. Use the `/register` command",
      ephemeral: true,
    });
  }

  if (user.bannedUntil && new Date() < user.bannedUntil) {
    return interaction.reply({
      content: `You are banned from matchmaking until ${user.bannedUntil.toLocaleString(
        "de-DE"
      )}`,
      ephemeral: true,
    });
  }

  /* const player = await xeroClient.fetchPlayer(user.ingameName);

  // Check if player is at least semi level
  if (player.level < 21) {
    return interaction.reply({
      content: `You have to be at least <:semipro:1107784693421711491> (Semi-Pro) to play ranked. Either wait until you level up or link to another account. To un-link in this case, ask an Admin.`,
      ephemeral: true,
    });
  } */

  // Check if player is already in a game
  if (GameManager.isPlayerInGame(member)) {
    const existingGame = GameManager.findGameByPlayer(member);

    return interaction.reply({
      content: `You are already part of a game, see ${existingGame.channel}`,
      ephemeral: true,
    });
  }

  await queue.add(interaction.member);

  await interaction.reply({
    content: "You joined the queue!",
    ephemeral: true,
  });

  if (queue.isFull()) {
    createGame(interaction, queue.players);

    queue.reset();
    setTimeout(() => queue.postEmbed(), 3000);
  }
}

async function handleQueueLeave(interaction, queue) {
  if (!queue.contains(interaction.member)) {
    return interaction.reply({
      content: "You're not in the queue.",
      ephemeral: true,
    });
  }

  await queue.remove(interaction.member);

  return interaction.reply({
    content: "You left the queue.",
    ephemeral: true,
  });
}

async function handleEditPlayerModal(interaction) {
  const xeroName = extractString(interaction.customId, "[", "]");

  const points = parseInt(interaction.fields.getTextInputValue("pointsInput"));
  const wins = parseInt(interaction.fields.getTextInputValue("winsInput"));
  const losses = parseInt(interaction.fields.getTextInputValue("lossesInput"));

  const user = await UserModel.findOne({ where: { ingameName: xeroName } });

  if (!user) {
    return interaction.reply({
      content: "User is not registered",
      ephemeral: true,
    });
  }

  await UserModel.update(
    { points: points, wins: wins, losses: losses },
    { where: { ingameName: xeroName } }
  );

  const member = interaction.guild.members.cache.find(
    (m) => m.user.tag === user.discordName
  );

  try {
    await member.setNickname(`${xeroName} [${points}]`);
  } catch (err) {
    console.log(err);
  }

  return interaction.reply({
    content: "Successfully edited player stats!",
    ephemeral: true,
  });
}

async function handleMapBan(interaction) {
  // Find game which the player is in
  const member = interaction.member;
  const game = GameManager.findGameByPlayer(member);

  if (!game) {
    return interaction.reply({
      content: "You are not in a game",
      ephemeral: true,
    });
  }

  if (game.state !== "map-ban-a" && game.state !== "map-ban-b") {
    return interaction.reply({
      content: "Map banning phase is over",
      ephemeral: true,
    });
  }

  if (
    interaction.customId === "map-ban-select-a" &&
    game.state !== "map-ban-a"
  ) {
    return interaction.reply({
      content: "The first map has already been banned",
      ephemeral: true,
    });
  }

  // Check if this player is a captain
  if (member !== game.captainA && member !== game.captainB) {
    return interaction.reply({
      content: "You are not a captain",
      ephemeral: true,
    });
  }

  // Check if it's this player's turn to pick
  if (game.state === "map-ban-a" && member !== game.captainA) {
    return interaction.reply({
      content: "Captain A has to pick first!",
      ephemeral: true,
    });
  }

  if (game.state === "map-ban-b" && member !== game.captainB) {
    return interaction.reply({
      content: "It is captain B's turn to pick!",
      ephemeral: true,
    });
  }

  // Ban the picked map from the pool
  const pickedMap = interaction.values[0];

  if (!game.banMap(pickedMap)) {
    return interaction.reply({
      content: "This map was already banned",
      ephemeral: true,
    });
  }

  if (game.state === "map-ban-a") {
    game.state = "map-ban-b";

    await interaction.reply(`${game.captainA} has banned ${pickedMap}`);

    // Post new menu
    return interaction.followUp({
      embeds: [buildMapBanEmbed(game.captainB)],
      components: [new ActionRowBuilder().addComponents(buildMapBanMenu("b"))],
    });
  } else {
    // 2 maps have been banned.
    // From the remaining 7 maps, pick one randomly
    const randomIndex = Math.floor(Math.random() * game.mapPool.length);
    const chosenMap = game.mapPool[randomIndex];

    game.map = chosenMap;
    game.state = "wait-for-result";

    await interaction.reply(`${game.captainB} has banned ${pickedMap}`);

    // Print final embed to summarize the game state
    return interaction.followUp({ embeds: [buildGameSummaryEmbed(game)] });
  }
}

function leaveOtherGuilds(client) {
  const guilds = client.guilds.cache;

  guilds.forEach((guild) => {
    if (guild.id !== guildId) {
      guild.leave();
      console.log(`Left guild ${guild.name}`);
    }
  });
}

async function getNextGameId() {
  const result = await GameModel.findOne({
    attributes: [[Sequelize.fn("max", Sequelize.col("id")), "maxId"]],
  });

  return result.get("maxId") + 1;
}

/* async function setupTournament() {
  const tournamentChannel = ChannelManager.findByName("tournament-info");
  const tournamentWishesChannel =
    ChannelManager.findByName("tournament-wishes");

  const embed = buildInfoEmbed(
    "Tournament",
    `**We are hosting a V2 tournament!**

**The rules are simple:**
- Register until 09.06.2023 with your teammate. You can also specify a substitute teammate for the case your premate isn't available.
- Only 2 vs. 2 is allowed.
- Match has to be 30 minutes / 10 touchdowns.
- Macros & tools - except for ingame IWJ - aren't allowed.

**Prize:**
- 1st place: 40€ + "Tournament King" role
- 2nd place: 20€
- 3rd place: 10€

**Wishes:**
Use the ${tournamentWishesChannel} channel to post your suggestions for the current and future tournaments. (Rule changes, map wishes, etc.)`
  );

  if (tournamentChannel) {
    await tournamentChannel.send({
      embeds: [embed],
    });
  }
} */

async function handleCommands(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

registerCommands(client);

client.once(Events.ClientReady, async (c) => {
  await UserModel.sync();
  await GameModel.sync();
  await ParticipantModel.sync();

  const nextGameId = await getNextGameId();

  console.log(`Ready! Logged in as ${c.user.tag}`);
  console.log("Synced database 'sophisticated.db'");

  leaveOtherGuilds(c);

  ChannelManager.init(c);
  GameManager.init(nextGameId);

  // Post tournament embed
  // await setupTournament();

  for (const queue of queues) {
    QueueManager.addQueue(
      new Queue(
        queue.name,
        queue.playerLimit,
        mapPool,
        ChannelManager.findByName(queue.channelName)
      )
    );
  }

  await QueueManager.start();
});

async function handlePickPhaseEnd(channel, game) {
  const unassignedPlayers = game.getTeamlessPlayers();

  if (game.teamB.length > game.teamA.length && unassignedPlayers.length > 0) {
    game.assignPlayerToTeam(unassignedPlayers[0], "A");
  }

  await channel.send({ embeds: [game.createEmbed()] });

  return channel.send({
    embeds: [buildMapBanEmbed(game.captainA)],
    components: [new ActionRowBuilder().addComponents(buildMapBanMenu("a"))],
  });
}

function handlePick(message) {
  const authorMember = message.member;
  const game = GameManager.findGameByPlayer(authorMember);

  console.log("entered handlePick function");

  if (!game) {
    message.delete();
    console.log("game does not exist");
    return;
  }

  if (game.state !== "pick-a" && game.state !== "pick-b") {
    message.delete();
    console.log("picking is over");
    return;
  }

  if (!message.channel.name.startsWith("game-")) {
    message.delete();
    console.log("you are not in a game channel");
    return;
  }

  if (authorMember !== game.captainA && authorMember !== game.captainB) {
    message.delete();
    console.log("you are not a captain");
    return;
  }

  if (game.state === "pick-a") {
    if (authorMember !== game.captainA) {
      message.delete();
      console.log("captain a needs to pick");
      return;
    }

    // Captain A can pick one player
    const mentionedMembers = message.mentions.members;

    if (mentionedMembers.size !== 1) {
      message.delete();
      console.log("captain a has to pick 1 member");
      return;
    }

    const pickedMember = mentionedMembers.at(0);

    if (!game.contains(pickedMember) || pickedMember === authorMember) {
      message.delete();
      console.log("game does not contain the picked member");
      return;
    }

    if (game.playerHasTeam(pickedMember)) {
      message.delete();
      console.log("picked player is already in a team");
      return;
    }

    // Assign picked member to team A
    game.assignPlayerToTeam(pickedMember, "A");
    game.state = "pick-b";

    const teamlessPlayers = game.getTeamlessPlayers();
    if (teamlessPlayers.length === 1) {
      game.assignPlayerToTeam(teamlessPlayers[0], "B");
      game.state = "map-ban-a";
      return handlePickPhaseEnd(message.channel, game);
    }

    message.channel.send({ embeds: [game.createEmbed()] });
  } else if (game.state === "pick-b") {
    if (authorMember !== game.captainB) {
      message.delete();
      console.log("captain b has to pick now");
      return;
    }

    const mentionedMembers = message.mentions.members;

    if (mentionedMembers.size !== 2) {
      message.delete();
      console.log("captain B has to pick 2 players");
      return;
    }

    if (
      !game.contains(mentionedMembers.at(0)) ||
      !game.contains(mentionedMembers.at(1)) ||
      mentionedMembers.at(0) === authorMember ||
      mentionedMembers.at(0) === authorMember
    ) {
      message.delete();
      console.log("game does not contain mentioned members");
      return;
    }

    if (
      game.playerHasTeam(mentionedMembers.at(0)) ||
      game.playerHasTeam(mentionedMembers.at(1))
    ) {
      message.delete();
      console.log("members are already in teams");
      return;
    }

    game.assignPlayerToTeam(mentionedMembers.at(0), "B");
    game.assignPlayerToTeam(mentionedMembers.at(1), "B");
    game.state = "map-ban-a";

    // message.channel.send({ embeds: [game.createEmbed()] });
    handlePickPhaseEnd(message.channel, game);
  }
}

client.on(Events.MessageCreate, async (message) => {
  if (message.content.includes("=p")) {
    handlePick(message);
  }

  message.mentions.members[0];

  console.log(`${message.author.tag}: ${message.content}`);
  console.log(`  Mentions: ${message.mentions.users.map((u) => u.tag)}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    const id = interaction.customId;
    const queueName = id.substring(id.indexOf("-") + 1);
    const queue = QueueManager.findQueueByName(queueName);

    if (id.startsWith("join")) {
      return handleQueueJoin(interaction, queue);
    }

    if (id.startsWith("leave")) {
      return handleQueueLeave(interaction, queue);
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith("player-edit-modal")) {
      return handleEditPlayerModal(interaction);
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith("map-ban-select")) {
      return handleMapBan(interaction);
    }
  }

  if (interaction.isChatInputCommand()) {
    handleCommands(interaction);
  }

  // Handle picking
});

client.login(token);
