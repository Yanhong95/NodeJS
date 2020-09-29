const express = require('express');
const router = express.Router();
const Ingredient = require('../models/ingredient');
const e = require('express');

router.get('/', async (req, res, next) => {
  try {
    const ingredients = await Ingredient.findOne();
    res.status(200).json(ingredients);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
});


module.exports = router;