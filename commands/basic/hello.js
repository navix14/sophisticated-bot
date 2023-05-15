const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("hello")
        .setDescription("Bot says hello to you"),
    async execute(interaction) {
      await interaction.reply({
        content: `Ayo!`
      });
    }
};