const { Client, Events, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');
const Users = require("./db/queue-api");
const { registerCommands } = require("./registerCommands");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers] });

registerCommands(client);

function postQueue(channel) {
    const mapDescription = `V3, CPD, 30 minutes

**Map pool**
<:jungle:1107382777059483699> Jungle
<:ziggurat:1107382418899468460> Ziggurat
<:templem:1107380807892471928> Temple-M
<:colosseum:1107382408585678868> Colosseum
<:neden3:1107382411785928789> Neden-3
<:tunnel:1107382417330802710> Tunnel
<:oldschool:1107382413769834546> Old-School
<:highway:1107382410582179945> Highway
<:st2:1107384857035812954> Station-2

**Players in queue: 0/6**
    `

    const exampleEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setThumbnail("https://i.imgur.com/A2kFwYL.png")
        .setTitle('Only-Sword Queue')
        .setDescription(mapDescription);

    const confirm = new ButtonBuilder()
			.setCustomId('confirm')
			.setLabel('Join queue')
			.setStyle(ButtonStyle.Success);

    const cancel = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Leave queue')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder()
        .addComponents(confirm, cancel);

    channel.send({ embeds: [exampleEmbed] });

    channel.send({
		components: [row],    
    })
}

client.once(Events.ClientReady, async c => {
    Users.sync();

	console.log(`Ready! Logged in as ${c.user.tag}`);
    console.log("Synced database 'sophisticated.db'");

    const channel = await c.channels.fetch("1107365471436689448");
    await channel.bulkDelete(100);
    
    // postQueue(channel);
});

client.on(Events.InteractionCreate, async interaction => {    
    if (!interaction.isChatInputCommand()) return;
    console.log("Interaction created");

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch(error) {
        console.error(error);
    }
});

client.login(token);