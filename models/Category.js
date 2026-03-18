const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  code: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  recipeCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  recipes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
    },
  ],
})

module.exports = mongoose.model('Category', categorySchema)
