const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

const toAuthResponse = (user) => {
  const token = jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  const userId = user._id.toString();
  return {
    token,
    user: {
      id: userId,
      username: user.username,
      email: user.email,
      address: user.address,
      role: user.role,
    },
  };
};

const register = async (req, res, next) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) return next({ status: 409, message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ ...req.body, password: hashedPassword });

    return res.status(201).json(toAuthResponse(user));
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return next({ status: 401, message: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return next({ status: 401, message: 'Invalid credentials' });

    return res.status(200).json(toAuthResponse(user));
  } catch (err) {
    return next(err);
  }
};

module.exports = { register, login };
