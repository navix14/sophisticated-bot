const {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

function buildMapBanMenu(state) {
  const mapPool = [
    "Jungle",
    "Ziggurat",
    "Temple-M",
    "Colosseum",
    "Neden-3",
    "Tunnel",
    "Old-School",
    "Highway",
    "Station-2",
  ];

  const select = new StringSelectMenuBuilder()
    .setCustomId(`map-ban-select-${state}`)
    .setPlaceholder("Select a map!")
    .addOptions(
      mapPool.map((map) =>
        new StringSelectMenuOptionBuilder().setLabel(map).setValue(map)
      )
    );

  return select;
}

module.exports = buildMapBanMenu;
