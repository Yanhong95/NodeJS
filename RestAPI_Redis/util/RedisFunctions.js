const { getRedis } = require('./RedisClient');

const SEP = "____";

exports.get = async (objectId, next) => {
  try {
    const rediskey = 'plan' + SEP + objectId;
    const result = await getHelper(rediskey);
    return result;
  } catch (err) {
    console.log(`Error in create plan: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in fetch plan phase';
    }
    next(err);
  }
}

const getHelper = async (rediskey, next) => {
  try {
    const resultObject = {};
    const asyncRedisClient = getRedis();
    const simple = await asyncRedisClient.hgetall(rediskey);
    Object.keys(simple).map(key => resultObject[key] = simple[key]);
    const keys = await asyncRedisClient.keys(`${rediskey + SEP}*`);
    const promise = keys.map(async key => {
      const keySet = await asyncRedisClient.smembers(key);
      if (keySet.length > 1) {
        const arr = [];
        const nestedPromise = keySet.map(async eachkey => {
          const nestedObject = await getHelper(eachkey);
          arr.push(nestedObject)
        });
        await Promise.all(nestedPromise).then(() => {
          resultObject[key.substring(key.lastIndexOf(SEP) + 4)] = [...arr];
        });
      } else {
        const embdObject = await getHelper(keySet[0]);
        resultObject[key.substring(key.lastIndexOf(SEP) + 4)] = {...embdObject};
      }
    });
    await Promise.all(promise);
    return resultObject
  } catch (err) {
    console.log(`Error in get plan: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in getHelper phase';
    }
    next(err);
  }
}

exports.create = async (objectId, payload, next) => {
  try {
    const rediskey = payload.objectType + SEP + objectId;
    const result = await createHelper(rediskey, payload, []);
    return result;
  } catch (err) {
    console.log(`Error in create plan: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in create plan phase';
    }
    next(err);
  }
}

const createHelper = async (rediskey, payload, arrayResult) => {
  try {
    const asyncRedisClient = getRedis();
    Promise.all( Object.keys(payload).map(async key => {
      const edge = key;
      const value = payload[key];
      if (Array.isArray(value)) {
        const setKey = rediskey + SEP + edge;
        Promise.all(value.map(async v => {
          const embd_key = v.objectType + SEP + v.objectId;
          await asyncRedisClient.sadd(setKey, embd_key);
          await createHelper(embd_key, v, []);
        }));
      } else if (typeof value === 'string' || typeof value === 'number') {
        arrayResult.push(key, value);
      } else {
        const setKey = rediskey + SEP + edge;
        const embd_key = value.objectType + SEP + value.objectId;
        await asyncRedisClient.sadd(setKey, embd_key);
        await createHelper(embd_key, value, []);
      }
    }));
    await asyncRedisClient.hmset(rediskey, arrayResult);
    return rediskey;
  } catch (err) {
    console.log(`Error in create plan: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in createHelper phase';
    }
    throw err;
  }
}

exports.delete = async (objectId, next) => {
  try {
    const rediskey = 'plan' + SEP + objectId;
    const result = await deleteHelper(rediskey);
    return result;
  } catch (err) {
    console.log(`Error in delete plan: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in delete plan phase';
    }
    next(err);
  }
}

const deleteHelper = async (rediskey) => {
  try {
    const asyncRedisClient = getRedis();
    const keys = await asyncRedisClient.keys(`${rediskey + SEP}*`);
    const promise = keys.map(async key => {
      await asyncRedisClient.del(key);
      const nestedkeys = await asyncRedisClient.smembers(key);
      Promise.all(nestedkeys.map(async nestedkey => {
        await deleteHelper(nestedkey);
      }));
    });
    await Promise.all(promise);
    await asyncRedisClient.del(rediskey);
    return true;
  } catch (err) {
    console.log(`Error in delete plan: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in delete plan phase';
    }
    throw err;
  }
}


exports.doesPlanExist= async (objectId, next) => {
  try {
    const asyncRedisClient = getRedis();
    const check = await asyncRedisClient.exists(`plan${SEP + objectId}`) && ! await asyncRedisClient.keys(`plan${SEP + objectId}`);
    // console.log('DoesPlanExist? ', check === 0 ? false : true);
    return check === 0 ? false : true; 
  } catch (error) {
    console.log(`Error in checking plan exist: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in checking plan exist phase';
    }
    next(err);
  }
}


const update = async (payload, next) => {
  try {
    const rediskey = payload.objectType + SEP + payload.objectId;
    const asyncRedisClient = getRedis();
    // let simple = await asyncRedisClient.hgetall(rediskey);
    // if (!simple) {
    //   simple = [];
    // }
    simple = [];
    Promise.all( Object.keys(payload).map(async key => {
      const edge = key;
      const value = payload[key];
      if (Array.isArray(value)) {
        const setKey = rediskey + SEP + edge;
        Promise.all(value.map(async v => {
          const embd_key = v.objectType + SEP + v.objectId;
          await asyncRedisClient.sadd(setKey, embd_key);
          await update(v);
        }));
      } else if (typeof value === 'string' || typeof value === 'number') {
        simple.push(key, value);
      } else {
        const setKey = rediskey + SEP + edge;
        const embd_key = value.objectType + SEP + value.objectId;
        await asyncRedisClient.sadd(setKey, embd_key);
        await update(value);
      }
    }));
    await asyncRedisClient.hmset(rediskey, simple);
    return rediskey;
  } catch (err) {
    console.log(`Error in create plan: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in create plan phase';
    }
    next(err);
  }
}
exports.update = update;