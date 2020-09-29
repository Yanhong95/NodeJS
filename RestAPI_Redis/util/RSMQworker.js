const rsmq = require("rsmq-worker")
const worker = new rsmq("MSQ", { host: "127.0.0.1", port: 6379, ns: "rsmq", autostart: false });

worker.on("message", function (msg, next, id) {

  // process your message user a try catch if something goes // messy with the parsing 

  let user_data = JSON.parse(msg)
  console.log(user_data);
  next()
});

// optional error listeners
worker.on('error', function (err, msg) {
  console.log("ERROR", err, msg.id);
});
worker.on('exceeded', function (msg) {
  console.log("EXCEEDED", msg.id);
});
worker.on('timeout', function (msg) {
  console.log("TIMEOUT", msg.id, msg.rc);
});

worker.start();

module.exports = worker;