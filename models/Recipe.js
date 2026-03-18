const mongoose = require('mongoose')

const layerSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    ingredients: {
      type: [String],
      required: true,
    },
  },
  { _id: false }
)

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  preparationTime: {
    type: Number,
    required: true,
    min: 0,
  },
  difficulty: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  addedDate: {
    type: Date,
    default: Date.now,
  },
  layers: {
    type: [layerSchema],
    default: [],
  },
  instructions: {
    type: [String],
    default: [],
  },
  image: {
    type: String,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
})

module.exports = mongoose.model('Recipe', recipeSchema)
