const RedisSMQ = require("rsmq");
const rsmq = new RedisSMQ({ host: "127.0.0.1", port: 6379, ns: "rsmq" });

module.exports = {
  create_queue: async () => {
    try {
      response = await rsmq.createQueueAsync({ qname: "MSQ" })
      if (response === 1) {
        console.log("Queue created", response);
      }
    } catch (err) {
      if (err.name == 'queueExists') {
        console.log("DQueue Exists");
      } else {
        console.log("redis error ", err );
      }
    }
  },
  send_Object: async (data) => {
    try {
      response = await rsmq.sendMessageAsync({
        qname: "MSQ",
        message: data
      })
      if (response) {
        console.log("Object sent. ID:", response);
      }
    } catch (err) {
      console.log(err)
    }
  }
}