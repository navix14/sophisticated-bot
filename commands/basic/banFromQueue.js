const { SlashCommandBuilder } = require("discord.js");
const UserModel = require("../../db/userModel");
const ChannelManager = require("../../channelManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban_ranked")
    .setDescription("Ban player from ranked queues")
    .addUserOption((option) =>
      option.setName("user").setDescription("Player").setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("hours")
        .setDescription("How many hours?")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const hours = interaction.options.getInteger("hours");

    if (!user) {
      return interaction.reply({
        content: "User does not exist",
        ephemeral: true,
      });
    }

    if (hours < 0) {
      return interaction.reply({
        content: "Hours must be greater than 0",
        ephemeral: true,
      });
    }

    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + hours * 60 * 60 * 1000);

    await UserModel.update(
      { bannedUntil: futureDate },
      { where: { discordName: user.tag } }
    );

    const bansChannel = ChannelManager.findByName("bans");

    bansChannel.send(
      `${user} has been banned until ${futureDate.toLocaleString()}`
    );

    return interaction.reply({
      content: `Banned ${user} from ranked queues until ${futureDate.toLocaleString()}`,
      ephemeral: true,
    });
  },
};
