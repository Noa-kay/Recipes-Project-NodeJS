const Joi = require('joi')

const registerUserSchema = Joi.object({
  username: Joi.string().trim().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.min': '"password" must be at least 8 characters',
      'string.pattern.base': '"password" must contain at least one letter and one number',
    }),
  email: Joi.string().email().lowercase().required(),
  address: Joi.string().optional(),
  role: Joi.string().valid('admin', 'user').default('user'),
})

const loginUserSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
})

module.exports = { registerUserSchema, loginUserSchema }
