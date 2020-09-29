// const redis = require('redis');
const asyncRedis = require("async-redis");

let client;

const redisConnect = async callback => {
  try {
    client = asyncRedis.createClient();
    client.on("error", function(error) {
      console.error(error);
    });
    // const result = await client.flushdb();
    // console.log(result, 'clean up Redis'); 
    console.log('Connected Redis!');
    callback();
  } catch(err){
    console.log(err);
    throw err;
  };
}

const getRedis = () => {
  if (client) {
    return client;
  }
  console.log('start server using redis-server');
  throw 'No database found!';
};

exports.redisConnect = redisConnect;
exports.getRedis = getRedis;