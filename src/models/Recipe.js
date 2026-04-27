const mongoose = require('mongoose');

const layerSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    ingredients: { type: [String], required: true },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    /** One or more categories (assignment: single category or array). */
    categories: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
      required: true,
      validate: [(v) => Array.isArray(v) && v.length >= 1, 'At least one category is required'],
    },
    preparationTime: { type: Number, required: true, min: 0 },
    difficulty: { type: Number, required: true, min: 1, max: 5 },
    addedDate: { type: Date, default: Date.now },
    layers: { type: [layerSchema], default: [] },
    instructions: { type: [String], default: [] },
    image: { type: String, default: '' },
    isPrivate: { type: Boolean, default: false },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

recipeSchema.index({ name: 'text', description: 'text', instructions: 'text' });

module.exports = mongoose.model('Recipe', recipeSchema);
