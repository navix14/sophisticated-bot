const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

function buildQueueEmbed(queueName, numPlayers, playerLimit, mapPool) {
  const mapPoolString = mapPool
    .map((m) => `${m.mapIcon} ${m.mapName}`)
    .join("\n");

  const mapDescription = `V${playerLimit / 2}, CPD, 30 minutes
    
**Map pool**
${mapPoolString}

**Players in queue: ${numPlayers}/${playerLimit}**
        `;

  const queueEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setThumbnail("https://i.imgur.com/A2kFwYL.png")
    .setTitle("Only-Sword Queue")
    .setDescription(mapDescription);

  const confirm = new ButtonBuilder()
    .setCustomId(`join-${queueName}`)
    .setLabel("Join queue")
    .setStyle(ButtonStyle.Success);

  const cancel = new ButtonBuilder()
    .setCustomId(`leave-${queueName}`)
    .setLabel("Leave queue")
    .setStyle(ButtonStyle.Danger);

  const actions = new ActionRowBuilder().addComponents(confirm, cancel);

  return { queueEmbed, actions };
}

module.exports = buildQueueEmbed;
