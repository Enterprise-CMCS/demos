process.env.KAFKAJS_NO_PARTITIONER_WARNING = 1;
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'hello-world-producer',
  brokers: ['localhost:9092'], 
});

const producer = kafka.producer();
const admin = kafka.admin();


const sendMessage = async () => {
  try {
    await producer.connect();
    
    const topics = await admin.listTopics();

    if (!topics.includes('hello-topic')) {                 
      await admin.createTopics({
        topics: [
          { topic: 'hello-topic', numPartitions: 1, replicationFactor: 1 }
        ],
      });
    }
    
    const result = await producer.send({
      topic: 'hello-topic',
      messages: [
        { value: 'Hello World!' },
      ],
    });
    
    console.log('Message sent successfully', result);
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    await producer.disconnect();
    await admin.disconnect();
  }
};

sendMessage();