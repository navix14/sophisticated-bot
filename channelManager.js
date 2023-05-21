const { ChannelType } = require("discord.js");

class ChannelManager {
  init(client) {
    this.client = client;
    this.channels = client.channels.cache;
  }

  findByName(channelName) {
    return this.channels.find(
      (channel) => channel.name.toLowerCase() === channelName.toLowerCase()
    );
  }

  getCategoryChannels() {
    return this.channels.filter(
      (channel) => channel.type === ChannelType.GuildCategory
    );
  }

  getTextChannels() {
    return this.channels.filter(
      (channel) => channel.type === ChannelType.GuildText
    );
  }
}

module.exports = new ChannelManager();
