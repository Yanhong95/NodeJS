const redis = require("redis");
const Ajv = require('ajv');
const etag = require('etag')
const planSchema = require('../schema/plan.json');
const redisFunctions = require('../util/RedisFunctions');
const elasticSearchClient = require('../util/ElasticSearchClient');
let globalEtag;

exports.createPlan = async (req, res, next) => {
  // console.log(req.userId);
  try {
    const ajv = new Ajv();
    const valid = ajv.validate(planSchema, req.body);
    console.log(`JSON schema validation result: ${valid}`);
    if (!valid) {
      console.log(ajv.errors);
      // 400 means the request could not be understood by the server due to malformed syntax
      return res.status(400).send({ message: `Invalid instance, ${ajv.errors[0].message}` });
    }
    if (await redisFunctions.doesPlanExist(req.body.objectId, next)) {
      // 409 means Conflict
      return res.status(409).send({ message: "Instance already existed." });
    }
    const id = await redisFunctions.create(req.body.objectId, req.body, next);
    if (!id) {
      return res.status(500).send({ message: "write in Redis failed" });
    }   
    // breakdown to small object and send to message queue
    await elasticSearchClient.breakDownObjecs(req.body.objectId, req.body, null, next, 'create');
    globalEtag = etag(req.body.objectId + Date.now())
    console.log('Etag for this plan is', globalEtag);
    res.setHeader('ETag', globalEtag);
    return res.status(201).send({ message: "Create successfully" , objectId: req.body.objectId, objecttype: req.body.objectType});
  } catch (err) {
    console.log(`Error in create plan: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in create plan phase';
    }
    next(err);
  }
},

exports.getPlan = async (req, res, next) => {
    try {
      if (!await redisFunctions.doesPlanExist(req.params.objectId, next)) {
        return res.status(404).send({ message: "Plan not found." });
      }
      const result = await redisFunctions.get(req.params.objectId, next);
      if (req.headers['if-none-match'] && req.headers['if-none-match'] === globalEtag) {
        console.log(globalEtag);
        console.log('304 Not Modified');
        return res.status(304).send({ message: 'Not Modified' });
      }
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send({ message: 'Plan fetched', plan: result });
    } catch (err) {
      console.log(`Error in get plan: ${err}`)
      if (!err.statusCode) {
        err.statusCode = 500;
        err.message = 'unexpected error caught in get plan phase';
      }
      next(err);
    }
  },

exports.deletePlan = async (req, res, next) => {
    try {
      if (!await redisFunctions.doesPlanExist(req.params.objectId, next)) {
        return res.status(404).send({ message: "Plan not found." });
      }
      const reply = await redisFunctions.delete(req.params.objectId, next);
      await elasticSearchClient.deleteDocument(next);
      if (reply) {
        return res.status(200).send({ message: "Delete successfully." });
      } else {
        return res.status(500).send({ message: "Delete fail." });
      }
    } catch (err) {
      console.log(`Error in delete plan: ${err}`)
      if (!err.statusCode) {
        err.statusCode = 500;
        err.message = 'unexpected error caught in delete plan phase';
      }
      next(err);
    }
  }


exports.patchPlan = async (req, res, next) => {
  try {
    const ajv = new Ajv();
    if (!await redisFunctions.doesPlanExist(req.params.objectId, next)) {
      return res.status(404).send({ message: "Plan not found." });
    }
    const valid = ajv.validate(planSchema, req.body);
    console.log(`JSON schema validation result: ${valid}`);
    if (!valid) {
      console.log(ajv.errors);
      return res.status(400).send({ message: `Invalid instance, ${ajv.errors[0].message}` });
    }
    if (!req.headers['if-match'] || req.headers['if-match'] !== globalEtag) {
      return res.status(412).send({ message: `Precondition Failed or Plan has been modified` });
    }
    const id = await redisFunctions.update(req.body)
    if (!id) {
      return res.status(500).send({ message: "Update in Redis failed" });
    }
    // breakdown to small object and send to message queue
    await elasticSearchClient.breakDownObjecs(req.params.objectId, req.body, null, next, 'update');
    const result = await redisFunctions.get(req.params.objectId);
    globalEtag = etag(req.params.objectId + Date.now())
    console.log('Etag for this updated plan is', globalEtag);
    res.setHeader('ETag', globalEtag);
    return res.status(200).send({ message: 'Updating successfully', newEtag:globalEtag, newPlan: result });
  } catch (err) {
    console.log(`Error in patch plan: ${err}`)
    if (!err.statusCode) {
      err.statusCode = 500;
      err.message = 'unexpected error caught in patch plan phase';
    }
    next(err);
  }
}

