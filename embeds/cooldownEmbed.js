const buildErrorEmbed = require("./errorEmbed");

function buildCooldownEmbed(xeroName, nextLinkDate) {
  const embed = buildErrorEmbed(
    "Re-Link Cooldown",
    `You are already linked to **${xeroName}**.
  Your next re-link is possible at **${nextLinkDate.toLocaleString()}**`
  );

  return embed;
}

module.exports = buildCooldownEmbed;
