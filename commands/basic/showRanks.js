const { SlashCommandBuilder } = require("discord.js");
const buildInfoEmbed = require("../../embeds/infoEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ranks")
    .setDescription("Show ELO ranks"),
  async execute(interaction) {
    const ranksEmbed = buildInfoEmbed(
      "ELO Ranks",
      `**Bronze:** 100 - 499
**Silver:** 500 - 1.499
**Gold**: 1.500 - 3.999
**Platin**: 4.000 - 9.999
**Grandmaster**: 10.000 - 29.999
**Gigachad**: 30.000+`
    );

    return interaction.reply({ embeds: [ranksEmbed] });
  },
};
