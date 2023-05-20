const buildQueueEmbed = require("../embeds/queueEmbed");

class Queue {
  constructor(queueName, playerLimit, mapPool, channel) {
    this.queueName = queueName;
    this.players = [];
    this.embedMessage = null;
    this.channel = channel;
    this.playerLimit = playerLimit;
    this.mapPool = mapPool;
  }

  contains(member) {
    return this.players.includes(member);
  }

  reset() {
    this.players = [];
    this.embedMessage = null;
  }

  isFull() {
    return this.players.length === this.playerLimit;
  }

  async add(member) {
    if (this.players.length < this.playerLimit) {
      this.players.push(member);

      if (this.embedMessage) {
        await this.embedMessage.edit({
          embeds: [this.createEmbed()],
        });
      }
    }
  }

  async remove(member) {
    this.players = this.players.filter((m) => m !== member);

    if (this.embedMessage) {
      await this.embedMessage.edit({
        embeds: [this.createEmbed()],
      });
    }
  }

  setEmbedMessage(embedMessage) {
    this.embedMessage = embedMessage;
  }

  async postEmbed() {
    await this.channel.bulkDelete(100);

    const { queueEmbed, actions } = buildQueueEmbed(
      this.queueName,
      this.players.length,
      this.playerLimit,
      this.mapPool
    );

    const embedMessage = await this.channel.send({ embeds: [queueEmbed] });

    this.embedMessage = embedMessage;

    await this.channel.send({
      components: [actions],
    });
  }

  createEmbed() {
    return buildQueueEmbed(
      this.queueName,
      this.players.length,
      this.playerLimit,
      this.mapPool
    ).queueEmbed;
  }
}

module.exports = Queue;
