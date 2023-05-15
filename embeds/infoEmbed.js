const { EmbedBuilder, Colors } = require("discord.js");

function buildInfoEmbed(title, body, imageUrl) {
  if (!imageUrl) {
    imageUrl = null;
  }

  const embed = new EmbedBuilder()
    .setColor(Colors.Blue)
    .setTitle(title)
    .setThumbnail(imageUrl)
    .setDescription(body);

  return embed;
}

module.exports = buildInfoEmbed;
