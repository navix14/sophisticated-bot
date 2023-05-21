const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("translate")
    .setDescription("Translates shit to turkish")
    .addStringOption((option) =>
      option.setName("text").setDescription("Go ahead").setRequired(true)
    )
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    const text = interaction.options.getString("text");

    const res = await fetch("http://127.0.0.1:5000/translate", {
      method: "POST",
      body: JSON.stringify({
        q: text,
        source: "auto",
        target: "tr",
        format: "text",
        api_key: "",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const json = await res.json();

    return interaction.reply(`${text} -> ${json.translatedText}`);
  },
};
