const { EmbedBuilder, Colors } = require("discord.js");

function buildErrorEmbed(title, body) {
  const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle(title)
    .setDescription(body);

  return embed;
}

module.exports = buildErrorEmbed;
