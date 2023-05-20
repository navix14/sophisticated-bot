const buildInfoEmbed = require("./infoEmbed");

function buildMapBanEmbed(captain) {
  const embed = buildInfoEmbed(
    "Map ban phase",
    `**Map pool:**
<:jungle:1107382777059483699> Jungle
<:ziggurat:1107382418899468460> Ziggurat
<:templem:1107380807892471928> Temple-M
<:colosseum:1107382408585678868> Colosseum
<:neden3:1107382411785928789> Neden-3
<:tunnel:1107382417330802710> Tunnel
<:oldschool:1107382413769834546> Old-School
<:highway:1107382410582179945> Highway
<:st2:1107384857035812954> Station-2

${captain} ban a map using the menu below!`
  );

  return embed;
}

module.exports = buildMapBanEmbed;
