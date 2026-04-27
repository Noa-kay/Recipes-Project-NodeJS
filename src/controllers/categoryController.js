const Category = require('../models/Category');

const getCategories = async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ code: 1 });
    return res.status(200).json(categories);
  } catch (err) {
    return next(err);
  }
};

const getCategoriesWithRecipes = async (_req, res, next) => {
  try {
    const categories = await Category.find().populate({
      path: 'recipes',
      populate: [
        { path: 'addedBy', select: 'username email' },
        { path: 'categories', select: 'code description' },
      ],
    });
    return res.status(200).json(categories);
  } catch (err) {
    return next(err);
  }
};

const getCategoryByCodeOrName = async (req, res, next) => {
  try {
    const key = req.params.key;
    const category = await Category.findOne({
      $or: [{ code: key }, { description: { $regex: `^${key}$`, $options: 'i' } }],
    }).populate({
      path: 'recipes',
      populate: [{ path: 'addedBy', select: 'username email' }],
    });

    if (!category) return next({ status: 404, message: 'Category not found' });
    return res.status(200).json(category);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getCategories, getCategoriesWithRecipes, getCategoryByCodeOrName };
