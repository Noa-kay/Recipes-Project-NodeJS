const jwt = require('jsonwebtoken');
const env = require('../config/env');

const getTokenFromHeader = (header = '') => {
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7);
};

const authRequired = (req, _res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) return next({ status: 401, message: 'Authentication required' });
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;
    return next();
  } catch (_err) {
    return next({ status: 401, message: 'Invalid or expired token' });
  }
};

const authOptional = (req, _res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) return next();
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;
    return next();
  } catch (_err) {
    return next();
  }
};

const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next({ status: 401, message: 'Authentication required' });
  if (!roles.includes(req.user.role)) return next({ status: 403, message: 'Forbidden' });
  return next();
};

module.exports = { authRequired, authOptional, requireRole };
