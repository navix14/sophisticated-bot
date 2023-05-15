const { SlashCommandBuilder } = require("discord.js");
const Users = require("../../db/queue-api");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("Register your Discord account with your ingame Xero account")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Your ingame Xero name")
                .setRequired(true)),
    async execute(interaction) {
        const username = interaction.options.getString("name");
        const discordName = `${interaction.user.username}#${interaction.user.discriminator}`;

        // Save into database
        try {
            await Users.create({
                discord_name: discordName,
                ingame_name: username
            });
        } catch (error) {            
            if (error.name === "SequelizeUniqueConstraintError") {
                const user = await Users.findOne({ where: { discord_name: discordName}});
                return interaction.reply(`${interaction.user} is already linked to '${user.ingame_name}'`);
            }
        }
        
        // Rename user
        await interaction.member.setNickname(username);

        return interaction.reply({
            content: `${interaction.user} has been linked to '${username}'`
        });
    }
};