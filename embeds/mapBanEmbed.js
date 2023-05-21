const buildInfoEmbed = require("./infoEmbed");
const { mapPool } = require("../config.json");

function buildMapBanEmbed(captain) {
  const maps = mapPool.map((map) => `${map.mapIcon} ${map.mapName}`).join("\n");

  const embed = buildInfoEmbed(
    "Map ban phase",
    `**Map pool:**
${maps}

${captain} ban a map using the menu below!`
  );

  return embed;
}

module.exports = buildMapBanEmbed;
