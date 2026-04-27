const Joi = require('joi');

const createCategorySchema = Joi.object({
  code: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
});

module.exports = { createCategorySchema };
