const express = require('express');
const { register, login } = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { registerUserSchema, loginUserSchema } = require('../validations/userValidation');

const router = express.Router();

router.post('/register', validate(registerUserSchema), register);
router.post('/login', validate(loginUserSchema), login);

module.exports = router;
