// 'use strict'
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })
const { send_Object } = require('../util/RSMQClient');

const breakDownObjecs = async (objectId, payload, type, next, operationType) => {
  try {
    const obj = {};
    Promise.all(Object.keys(payload).map(async key => {
      const value = payload[key];
      if (Array.isArray(value)) {
        Promise.all(value.map(async nestedObject => {
          await breakDownObjecs(payload.objectId, nestedObject, payload.objectType, next, operationType);
        }));
      } else if (typeof value === 'string' || typeof value === 'number') {
        obj[key] = value;
      } else {
        currObject = { ...value };
        if (type && currObject.objectType === 'membercostshare') {
          currObject.objectType = 'planservice_menbercostshare';
        }
        await breakDownObjecs(payload.objectId, currObject, payload.objectType, next, operationType);
      }
      obj.plan_service = {
        name: payload.objectType
      }
      if (type) {
        obj.plan_service.parent = objectId;
      }
    }));
    const message = {
      type: operationType,
      data: obj
    }
    // console.log(obj);
    send_Object(JSON.stringify(message));
  } catch (err) {
    console.log(`Error in indexing objext: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in indexing objext phase';
    }
    next(err);
  }
};

exports.breakDownObjecs = breakDownObjecs;

exports.createDocument = async (data) => {
  try {
    const parameter = {
      id: data.objectId,
      index: 'insurance',
      refresh: 'true',
      body: data
    };
    if (data.plan_service.parent) {
      parameter.routing = '12xvxc345ssdsds-508';
    }
    await client.index( parameter );
  } catch (err) {
    console.log(`Error in  create document: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in create document phase';
    }
  }
}

exports.updateDocument = async (data) => {
  try {
    const { body } = await client.exists({
      index: 'insurance',
      id: data.objectId
    })
    let parameter;
    if(body){
      parameter = {
        id: data.objectId,
        index: 'insurance',
        body: {
          doc: data
        }
      };
      await client.update( parameter );
    }else{
      parameter = {
        id: data.objectId,
        index: 'insurance',
        refresh: 'true',
        body: data
      };
      if (data.plan_service.parent) {
        parameter.routing = '12xvxc345ssdsds-508';
      }
      await client.index( parameter );
    }
  } catch (err) {
    console.log(`Error in updating document: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in updating document phase';
    }
  }
}



exports.deleteDocument = async (next) => {
  try {
    const res = await client.deleteByQuery({
      index: 'insurance',
      conflicts: 'proceed',
      body: {
        "query": {
          "match_all": {}
        }
      }
    });
    console.log("Delete successfully in elasticsearch ", res );
  } catch (err) {
    console.log(`Error in deleting object: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in deleting objext phase';
    }
    next(err);
  }
};

exports.mappingIndex = async (next) => {
  try {
    const { body } = await client.indices.exists({
      index: 'insurance',
    })
    console.log('index existed: ', body);
    // mapping
    if (!body) {
      await client.indices.create({
        index: 'insurance',
        body: {
          mappings: {
            properties: {
              objextId: { type: 'keyword' },
              plan_service: {
                type: 'join',
                relations: {
                  plan: ['membercostshare', 'planservice'],
                  planservice: ['service', 'planservice_menbercostshare']
                }
              }
            }
          }
        }
      });
    }
    // index parent
    await client.index({
      id: '12xvxc345ssdsds-508',
      index: 'insurance',
      refresh: 'true',
      body: {
        _org: 'example.com',
        objectId: '12xvxc345ssdsds-508',
        objectType: 'plan',
        planType: 'inNetwork',
        creationDate: '12-12-2017',
        plan_service: {
          name: "plan"
        }
      }
    })
    // index child
    await client.index({
      id: '1234vxc2324sdf-502',
      index: 'insurance',
      refresh: 'true',
      routing: '12xvxc345ssdsds-508',
      body: {
        deductible: 2000,
        _org: 'example.com',
        copay: 23,
        objectId: '1234vxc2324sdf-501',
        objectType: 'membercostshare',
        plan_service: {
          name: "membercostshare",
          parent: "12xvxc345ssdsds-508"
        }
      }
    })
  } catch (err) {
    console.log(`Error in create mapping: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in create mapping phase';
    }
    next(err);
  }
};




// { deductible: 2000,
//   _org: 'example.com',
//   copay: 23,
//   objectId: '1234vxc2324sdf-501',
//   objectType: 'membercostshare',
//   plan_service: { name: 'membercostshare', parent: '12xvxc345ssdsds-508' }
// }

// { _org: 'example.com',
//   objectId: '1234520xvc30asdf-502',
//   objectType: 'service',
//   name: 'Yearly physical',
//   plan_service: { name: 'service', parent: '27283xvx9asdff-504' }
// }

// { deductible: 10,
//   _org: 'example.com',
//   copay: 0,
//   objectId: '1234512xvc1314asdfs-503',
//   objectType: 'planservice_menbercostshare',
//   plan_service: { name: 'planservice_menbercostshare', parent: '27283xvx9asdff-504' }
// }

// { _org: 'example.com',
//   objectId: '27283xvx9asdff-504',
//   objectType: 'planservice',
//   plan_service: { name: 'planservice', parent: '12xvxc345ssdsds-508' }
// }

// { _org: 'example.com',
//   objectId: '1234520xvc30sfs-505',
//   objectType: 'service',
//   name: 'well baby',
//   plan_service: { name: 'service', parent: '27283xvx9sdf-507' }
// }

// { deductible: 10,
//   _org: 'example.com',
//   copay: 175,
//   objectId: '1234512xvc1314sdfsd-506',
//   objectType: 'planservice_menbercostshare',
//   plan_service: { name: 'planservice_menbercostshare', parent: '27283xvx9sdf-507' }
// }

// { _org: 'example.com',
//   objectId: '27283xvx9sdf-507',
//   objectType: 'planservice' 
//   plan_service: { name: 'planservice', parent: '12xvxc345ssdsds-508' }
// }

// { _org: 'example.com',
//   objectId: '12xvxc345ssdsds-508',
//   objectType: 'plan',
//   planType: 'inNetwork',
//   creationDate: '12-12-2017' 
//   plan_service: { name: 'plan' }
// }