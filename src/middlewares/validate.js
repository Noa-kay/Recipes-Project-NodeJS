const validate = (schema, target = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[target], { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map((item) => item.message).join(', ');
    return next({ status: 400, message: details });
  }
  req[target] = value;
  return next();
};

module.exports = validate;
