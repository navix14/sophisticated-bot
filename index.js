const {
  Client,
  Events,
  GatewayIntentBits,
  ChannelType,
  ActionRowBuilder,
} = require("discord.js");
const { token, mapPool, gameCategory, queues } = require("./config.json");
const { registerCommands } = require("./registerCommands");
const { UserModel, GameModel, ParticipantModel } = require("./db");
const { extractString } = require("./utils");
const { buildInfoEmbed, buildMapBanEmbed } = require("./embeds");
const { buildMapBanMenu } = require("./menus");
const { Queue, RankedGame, QueueManager, GameManager } = require("./game");
const ChannelManager = require("./channelManager");
const XeroClient = require("./xero-api/xeroClient");
const { Sequelize } = require("sequelize");

const xeroClient = new XeroClient();

async function createGame(interaction, players) {
  const gameId = GameManager.nextGameId;

  const gameChannel = await interaction.guild.channels.create({
    name: `game-${gameId}`,
    type: ChannelType.GuildText,
    parent: ChannelManager.findByName(gameCategory),
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

  const mentionString = playersShuffled.join(" ");

  await gameChannel.send(`${mentionString}
Captains have been chosen!

Captain A: **${game.captainA}**
Captain B: **${game.captainB}**`);

  await gameChannel.send({ embeds: [game.createEmbed()] });
}

async function handleQueueConfirm(interaction, queue) {
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
      content: `You are banned from matchmaking until ${user.bannedUntil.toLocaleString()}`,
      ephemeral: true,
    });
  }

  const player = await xeroClient.fetchPlayer(user.ingameName);

  // Check if player is at least semi level
  if (player.level < 21) {
    return interaction.reply({
      content: `You have to be at least <:semipro:1107784693421711491> (Semi-Pro) to play ranked. Either wait until you level up or link to another account. To un-link in this case, ask an Admin.`,
      ephemeral: true,
    });
  }

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

async function handleQueueCancel(interaction, queue) {
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

  const user = UserModel.findOne({ where: { ingameName: xeroName } });

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

  return interaction.reply({
    content: "Successfully edited player stats!",
    ephemeral: true,
  });
}

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

    await interaction.reply(`${game.captainB} has banned ${pickedMap}`);

    // Print final embed to summarize the game state
    const summaryEmbed = buildInfoEmbed(
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

    game.state = "wait-for-result";

    return interaction.followUp({ embeds: [summaryEmbed] });
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

registerCommands(client);

client.once(Events.ClientReady, async (c) => {
  await UserModel.sync();
  await GameModel.sync();
  await ParticipantModel.sync();

  console.log(`Ready! Logged in as ${c.user.tag}`);
  console.log("Synced database 'sophisticated.db'");

  const result = await GameModel.findOne({
    attributes: [[Sequelize.fn("max", Sequelize.col("id")), "maxId"]],
  });

  ChannelManager.init(c);
  GameManager.init(result.get("maxId") + 1);

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

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    const id = interaction.customId;
    const queueName = id.substring(id.indexOf("-") + 1);
    const queue = QueueManager.findQueueByName(queueName);

    if (id.startsWith("join")) {
      return handleQueueConfirm(interaction, queue);
    }

    if (id.startsWith("leave")) {
      return handleQueueCancel(interaction, queue);
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
});

client.login(token);
