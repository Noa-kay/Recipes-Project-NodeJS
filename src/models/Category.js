const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    recipeCount: { type: Number, default: 0, min: 0 },
    recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
