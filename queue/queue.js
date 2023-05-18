const buildQueueEmbed = require("../embeds/queueEmbed");

class Queue {
  constructor(channel, limit) {
    this.players = [];
    this.queueChannel = channel;
    this.embedMessage = null;
    this.limit = limit;
  }

  contains(member) {
    return this.players.includes(member);
  }

  reset() {
    this.players = [];
  }

  isFull() {
    return this.players.length === this.limit;
  }

  async add(member) {
    if (this.players.length < this.limit) {
      this.players.push(member);

      await this.embedMessage.edit({
        embeds: [this.createEmbed()],
      });
    }
  }

  async remove(member) {
    this.players = this.players.filter((m) => m !== member);

    await this.embedMessage.edit({
      embeds: [this.createEmbed()],
    });
  }

  setEmbedMessage(embedMessage) {
    this.embedMessage = embedMessage;
  }

  async postEmbed() {
    await this.queueChannel.bulkDelete(100);

    const { queueEmbed, actions } = buildQueueEmbed(this.players.length);
    const embedMessage = await this.queueChannel.send({ embeds: [queueEmbed] });

    this.embedMessage = embedMessage;

    await this.queueChannel.send({
      components: [actions],
    });
  }

  createEmbed() {
    return buildQueueEmbed(this.players.length).queueEmbed;
  }
}

module.exports = Queue;
