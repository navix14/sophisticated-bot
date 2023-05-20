const { EmbedBuilder, Colors } = require("discord.js");

function buildInfoEmbed(title, body, thumbnailUrl, imageUrl) {
  if (!thumbnailUrl) {
    thumbnailUrl = null;
  }

  if (!imageUrl) {
    imageUrl = null;
  }

  const embed = new EmbedBuilder()
    .setColor(Colors.Blue)
    .setTitle(title)
    .setThumbnail(thumbnailUrl)
    .setImage(imageUrl)
    .setDescription(body);

  return embed;
}

module.exports = buildInfoEmbed;
