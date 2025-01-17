import { config } from "dotenv";
config();

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async createConnection() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      console.log("RabbitMQ connection created.");
    } catch (error) {
      console.error(`Failed to create RabbitMQ connection: ${error}`);
      process.exit(1);
    }
  }

  async createExchange(exchangeName) {
    try {
      await this.channel.assertExchange(exchangeName, "direct", {
        durable: true,
      });
      console.log(`Exchange ${exchangeName} created.`);
    } catch (error) {
      console.error(`Failed to create exchange ${exchangeName}: ${error}`);
      process.exit(1);
    }
  }

  async createQueue(queueName) {
    try {
      await this.channel.assertQueue(queueName, {
        durable: true,
      });
      console.log(`Queue ${queueName} created.`);
    } catch (error) {
      console.error(`Failed to create queue ${queueName}: ${error}`);
      process.exit(1);
    }
  }

  async bindQueue(queueName, exchangeName, routingKey) {
    try {
      await this.channel.bindQueue(queueName, exchangeName, routingKey);
      console.log(
        `Queue ${queueName} bound to exchange ${exchangeName} with routing key ${routingKey}.`
      );
    } catch (error) {
      console.error(
        `Failed to bind queue ${queueName} to exchange ${exchangeName}: ${error}`
      );
      process.exit(1);
    }
  }

  async sendMessage(queueName, message) {
    try {
      await this.channel.sendToQueue(queueName, Buffer.from(message));
      console.log(`Message sent to queue ${queueName}: ${message}`);
    } catch (error) {
      console.error(`Failed to send message to queue ${queueName}: ${error}`);
      process.exit(1);
    }
  }

  async consumerMessage(queueName, callback) {
    try {
      await this.channel.consume(queueName, callback);
      console.log(`Consumer created for queue ${queueName}`);
    } catch (error) {
      console.error(
        `Failed to create consumer for queue ${queueName}: ${error}`
      );
      process.exit(1);
    }
  }
}
