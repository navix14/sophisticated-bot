const buildQueueEmbed = require("../embeds/queueEmbed");

class Queue {
  constructor(channel, limit) {
    this.queue = [];
    this.queueChannel = channel;
    this.embedMessage = null;
    this.limit = limit;
  }

  contains(member) {
    return this.queue.includes(member);
  }

  reset() {
    this.queue = [];
  }

  isFull() {
    return this.queue.length === this.limit;
  }

  add(member) {
    if (this.queue.length < this.limit) {
      this.queue.push(member);
    }
  }

  remove(member) {
    this.queue = this.queue.filter((m) => m !== member);
  }

  setEmbedMessage(embedMessage) {
    this.embedMessage = embedMessage;
  }

  async postEmbed() {
    await this.queueChannel.bulkDelete(100);

    const { queueEmbed, actions } = buildQueueEmbed(this.queue.length);
    const embedMessage = await this.queueChannel.send({ embeds: [queueEmbed] });

    this.embedMessage = embedMessage;

    await this.queueChannel.send({
      components: [actions],
    });
  }

  createEmbed() {
    return buildQueueEmbed(this.queue.length).queueEmbed;
  }
}

module.exports = Queue;
