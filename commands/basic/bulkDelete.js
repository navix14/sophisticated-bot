const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bulk_delete")
        .setDescription("Bulk-delete messages in current channel")
        .addIntegerOption(option =>
            option.setName("num_messages")
                .setDescription("Number of messages to delete")
                .setRequired(true))
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        const numMessages = interaction.options.getInteger("num_messages");

        await interaction.channel.bulkDelete(numMessages);

        const message = await interaction.reply({
            content: `Deleted the last ${numMessages} messages.`
        });

        setTimeout(() => {
            message.delete();
        }, 2000);
    }
};