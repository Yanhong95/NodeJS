const express = require('express');
const planController = require('../controller/planController');
const router = express.Router();
const es = require('../util/ElasticSearchClient');
const isAuth = require('../middleware/Oauth');

// router.post('/test',isAuth, es.mappingIndex )
router.post('/', isAuth, planController.createPlan);
router.get('/:objectId', isAuth, planController.getPlan);
router.delete('/:objectId', isAuth, planController.deletePlan);
router.patch('/:objectId', isAuth, planController.patchPlan);

module.exports = router;