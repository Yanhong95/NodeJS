const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ingredientSchema = new Schema({
  bacon: {
    type: Number,
  },
  cheese: {
    type: Number
  },
  meat: {
    type: Number
  },
  salad: {
    type: Number
  }
});

module.exports = mongoose.model('ingredient', ingredientSchema);