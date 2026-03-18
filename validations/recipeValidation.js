const Joi = require('joi')

const layerSchema = Joi.object({
  description: Joi.string().required(),
  ingredients: Joi.array().items(Joi.string()).min(1).required(),
})

const createRecipeSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().required(),
  category: Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .required()
    .messages({ 'string.pattern.base': '"category" must be a valid ObjectId' }),
  preparationTime: Joi.number().min(0).required(),
  difficulty: Joi.number().integer().min(1).max(5).required(),
  layers: Joi.array().items(layerSchema).default([]),
  instructions: Joi.array().items(Joi.string()).default([]),
  image: Joi.string().optional(),
  isPrivate: Joi.boolean().default(false),
})

module.exports = { createRecipeSchema }
