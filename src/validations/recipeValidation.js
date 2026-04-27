const Joi = require('joi');

const layerSchema = Joi.object({
  description: Joi.string().required(),
  ingredients: Joi.array().items(Joi.string()).min(1).required(),
});

const categoryXor = (value, helpers) => {
  const hasSingle = !!value.category;
  const hasMulti = Array.isArray(value.categories) && value.categories.length > 0;
  if (!hasSingle && !hasMulti) {
    return helpers.message('Provide either category or categories (non-empty array)');
  }
  if (hasSingle && hasMulti) {
    return helpers.message('Provide only one of category or categories');
  }
  return value;
};

const createRecipeSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().required(),
  category: Joi.string().trim().optional(),
  categories: Joi.array().items(Joi.string().trim()).min(1).optional(),
  categoryDescription: Joi.string().trim().allow('').optional(),
  preparationTime: Joi.number().min(0).required(),
  difficulty: Joi.number().integer().min(1).max(5).required(),
  layers: Joi.array().items(layerSchema).default([]),
  instructions: Joi.array().items(Joi.string()).default([]),
  image: Joi.string().allow('').optional(),
  isPrivate: Joi.boolean().default(false),
}).custom(categoryXor);

const updateRecipeSchema = Joi.object({
  name: Joi.string().trim().optional(),
  description: Joi.string().optional(),
  category: Joi.string().trim().optional(),
  categories: Joi.array().items(Joi.string().trim()).min(1).optional(),
  categoryDescription: Joi.string().trim().allow('').optional(),
  preparationTime: Joi.number().min(0).optional(),
  difficulty: Joi.number().integer().min(1).max(5).optional(),
  layers: Joi.array().items(layerSchema).optional(),
  instructions: Joi.array().items(Joi.string()).optional(),
  image: Joi.string().allow('').optional(),
  isPrivate: Joi.boolean().optional(),
}).custom((value, helpers) => {
  const hasSingle = !!value.category;
  const hasMulti = Array.isArray(value.categories) && value.categories.length > 0;
  if (hasSingle && hasMulti) {
    return helpers.message('Provide only one of category or categories');
  }
  return value;
});

module.exports = { createRecipeSchema, updateRecipeSchema };
