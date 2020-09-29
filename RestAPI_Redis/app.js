const express = require('express');
const bodyParser = require('body-parser');
const planRoute = require('./routes/plan');
const elasticSearchClient = require('./util/ElasticSearchClient');
const { redisConnect } = require('./util/RedisClient');
const { create_queue } = require('./util/RSMQClient');

const rsmq = require("rsmq-worker")
const worker = new rsmq("MSQ", { host: "127.0.0.1", port: 6379, ns: "rsmq", autostart: false });
const app = express();

redisConnect(() => {
  app.listen(8080, () => { console.log('Server started'); });
});

create_queue();

// parse application/json 针对json传输
app.use(bodyParser.json())

// set Etag as strong type;
app.set('etag', 'strong');

app.use((req, res, next) => {
  // allow any domain to access this server
  res.setHeader('Access-Control-Allow-Origin', '*');
  // accept part of http method
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  // specify allowed headers
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, If-Match, If-None-Match');
  next();
});

app.use('/plan', planRoute);

worker.on("message", function (msg, next, id) {
  // process your message user a try catch if something goes // messy with the parsing 
  const message = JSON.parse(msg)
  if(message.type === 'create'){
    elasticSearchClient.createDocument(message.data);
  }else if(message.type === 'update'){
    elasticSearchClient.updateDocument(message.data);
  }
  next();
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

// errorHandler middleware
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({
    message: message,
    data: data
  })
});



// ◦ Search with join using Elastic
// ◦ Parent-Child indexing
// ◦ Queueing



// ◦ Security 
// ◦ Rest API that can handle any structured data in Json
// ◦ Rest API with support for crud operations, including merge support, cascaded delete
// ◦ Rest API with support for validation
// ◦ Json Schema describing the data model for the use case
// ◦ Advanced semantics with rest API operations such as update if not changed
// ◦ Storage of data in key/value store


// curl -XDELETE 'http://localhost:9200/.kibana_1'  --header "content-type: application/JSON" -u elastic -p
// curl -XDELETE 'http://localhost:9200/.kibana_2'  --header "content-type: application/JSON" -u elastic -p
// curl -XPUT -H "Content-Type: application/json" http://localhost:9200/_all/_settings -d '{"index.blocks.read_only_allow_delete": null}'
// /Users/CYH/Elasticsearch/kibana-7.8.0-darwin-x86_64/bin/kibana    
// /Users/CYH/Elasticsearch/Elasticsearch-7.8.0/bin/elasticsearch  