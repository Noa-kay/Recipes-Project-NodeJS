const Joi = require('joi')

const createCategorySchema = Joi.object({
  code: Joi.alternatives()
    .try(Joi.string().trim(), Joi.number())
    .required()
    .messages({ 'alternatives.match': '"code" must be a string or a number' }),
  description: Joi.string().trim().required(),
  recipeCount: Joi.number().integer().min(0).default(0),
  recipes: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[a-fA-F0-9]{24}$/)
        .messages({ 'string.pattern.base': 'Each recipe must be a valid ObjectId' })
    )
    .default([]),
})

module.exports = { createCategorySchema }
