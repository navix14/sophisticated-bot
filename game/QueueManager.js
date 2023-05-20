class QueueManager {
  constructor() {
    this.queues = [];
  }

  addQueue(queue) {
    this.queues.push(queue);
  }

  removeQueue(queue) {
    const index = this.queues.indexOf(queue);

    if (index >= 0) {
      this.queues.splice(index, 1);
    }
  }

  findQueueByName(queueName) {
    return this.queues.find((queue) => queue.queueName === queueName);
  }

  findQueueByPlayer(member) {
    return this.queues.find((queue) => queue.contains(member));
  }

  isMemberInQueue(member) {
    return this.queues.some((queue) => queue.contains(member));
  }

  async start() {
    for (const queue of this.queues) {
      await queue.postEmbed();
    }
  }
}

module.exports = new QueueManager();
