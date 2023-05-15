const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

function buildQueueEmbed(numPlayers) {
  const mapDescription = `V3, CPD, 30 minutes
    
    **Map pool**
    <:jungle:1107382777059483699> Jungle
    <:ziggurat:1107382418899468460> Ziggurat
    <:templem:1107380807892471928> Temple-M
    <:colosseum:1107382408585678868> Colosseum
    <:neden3:1107382411785928789> Neden-3
    <:tunnel:1107382417330802710> Tunnel
    <:oldschool:1107382413769834546> Old-School
    <:highway:1107382410582179945> Highway
    <:st2:1107384857035812954> Station-2
    
    **Players in queue: ${numPlayers}/6**
        `;

  const queueEmbed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setThumbnail("https://i.imgur.com/A2kFwYL.png")
    .setTitle("Only-Sword Queue")
    .setDescription(mapDescription);

  const confirm = new ButtonBuilder()
    .setCustomId("confirm")
    .setLabel("Join queue")
    .setStyle(ButtonStyle.Success);

  const cancel = new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Leave queue")
    .setStyle(ButtonStyle.Danger);

  const actions = new ActionRowBuilder().addComponents(confirm, cancel);

  return { queueEmbed, actions };
}

module.exports = buildQueueEmbed;
