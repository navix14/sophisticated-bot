const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

function buildPlayerEditModal(player) {
  const modal = new ModalBuilder()
    .setCustomId(`player-edit-modal[${player.ingameName}]`)
    .setTitle(`Edit stats of '${player.ingameName}'`);

  const pointsInput = new TextInputBuilder()
    .setCustomId("pointsInput")
    .setLabel("ELO Points")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(player.points.toString());

  const winsInput = new TextInputBuilder()
    .setCustomId("winsInput")
    .setLabel("Wins")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(player.wins.toString());

  const lossesInput = new TextInputBuilder()
    .setCustomId("lossesInput")
    .setLabel("Loses")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(player.losses.toString());

  modal.addComponents([
    new ActionRowBuilder().addComponents(pointsInput),
    new ActionRowBuilder().addComponents(winsInput),
    new ActionRowBuilder().addComponents(lossesInput),
  ]);

  return modal;
}

module.exports = buildPlayerEditModal;
