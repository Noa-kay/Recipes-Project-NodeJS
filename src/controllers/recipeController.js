const Recipe = require('../models/Recipe');
const Category = require('../models/Category');

const canManageRecipe = (recipe, user) => user && (user.role === 'admin' || recipe.addedBy.toString() === user.id);

const syncCategoryCount = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) return;
  category.recipeCount = category.recipes.length;
  await category.save();
};

const findOrCreateCategoryByCode = async (code, description = '') => {
  let category = await Category.findOne({ code });
  if (!category) {
    category = await Category.create({
      code,
      description: description || code,
      recipes: [],
      recipeCount: 0,
    });
  }
  return category;
};

const sameIdSet = (a, b) => {
  const sa = new Set(a.map((x) => String(x)));
  const sb = new Set(b.map((x) => String(x)));
  if (sa.size !== sb.size) return false;
  for (const x of sa) if (!sb.has(x)) return false;
  return true;
};

const codesFromBody = (body) => {
  if (body.categories?.length) return [...new Set(body.categories.map(String))];
  if (body.category) return [String(body.category)];
  return null;
};

const resolveCategoryDocs = async (codes, categoryDescription) => {
  const isSingle = codes.length === 1;
  return Promise.all(
    codes.map((code) =>
      findOrCreateCategoryByCode(code, isSingle ? categoryDescription || '' : '')
    )
  );
};

const linkRecipeToCategories = async (recipeId, categoryIds) => {
  await Category.updateMany({ _id: { $in: categoryIds } }, { $addToSet: { recipes: recipeId } });
  for (const id of categoryIds) await syncCategoryCount(id);
};

const unlinkRecipeFromCategories = async (recipeId, categoryIds) => {
  await Category.updateMany({ _id: { $in: categoryIds } }, { $pull: { recipes: recipeId } });
  for (const id of categoryIds) await syncCategoryCount(id);
};

const getRecipes = async (req, res, next) => {
  try {
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const page = Math.max(1, Number(req.query.page) || 1);
    const search = (req.query.search || '').trim();

    const filters = [];
    if (search) {
      filters.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { instructions: { $elemMatch: { $regex: search, $options: 'i' } } },
        ],
      });
    }

    if (req.user) {
      filters.push({ $or: [{ isPrivate: false }, { addedBy: req.user.id }] });
    } else {
      filters.push({ isPrivate: false });
    }

    const query = filters.length ? { $and: filters } : {};
    const total = await Recipe.countDocuments(query);

    const recipes = await Recipe.find(query)
      .populate('categories', 'code description')
      .populate('addedBy', 'username email')
      .sort({ addedDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({ page, limit, total, totalPages: Math.ceil(total / limit), recipes });
  } catch (err) {
    return next(err);
  }
};

const getRecipeById = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('categories', 'code description')
      .populate('addedBy', 'username email');
    if (!recipe) return next({ status: 404, message: 'Recipe not found' });

    if (recipe.isPrivate && !canManageRecipe(recipe, req.user)) {
      return next({ status: 403, message: 'Forbidden' });
    }
    return res.status(200).json(recipe);
  } catch (err) {
    return next(err);
  }
};

const getRecipesByPreparationTime = async (req, res, next) => {
  try {
    const minutes = Number(req.params.minutes);
    if (Number.isNaN(minutes) || minutes < 0) return next({ status: 400, message: 'Invalid minutes value' });

    const query = { preparationTime: { $lte: minutes } };
    if (req.user) {
      query.$or = [{ isPrivate: false }, { addedBy: req.user.id }];
    } else {
      query.isPrivate = false;
    }

    const recipes = await Recipe.find(query)
      .populate('categories', 'code description')
      .sort({ preparationTime: 1 });
    return res.status(200).json(recipes);
  } catch (err) {
    return next(err);
  }
};

const createRecipe = async (req, res, next) => {
  try {
    const codes = codesFromBody(req.body);
    if (!codes?.length) return next({ status: 400, message: 'category or categories required' });

    const categoryDocs = await resolveCategoryDocs(codes, req.body.categoryDescription);
    const categoryIds = categoryDocs.map((c) => c._id);

    const { category, categories, categoryDescription, ...rest } = req.body;
    void category;
    void categories;
    void categoryDescription;

    const recipe = await Recipe.create({
      ...rest,
      categories: categoryIds,
      addedBy: req.user.id,
    });

    await linkRecipeToCategories(recipe._id, categoryIds);

    const populated = await Recipe.findById(recipe._id)
      .populate('categories', 'code description')
      .populate('addedBy', 'username email');

    return res.status(201).json(populated);
  } catch (err) {
    return next(err);
  }
};

const updateRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return next({ status: 404, message: 'Recipe not found' });
    if (!canManageRecipe(recipe, req.user)) return next({ status: 403, message: 'Forbidden' });

    const prevIds = recipe.categories.map((id) => id);
    const codes = codesFromBody(req.body);

    const patch = { ...req.body };
    delete patch.category;
    delete patch.categories;
    delete patch.categoryDescription;

    let nextIds = prevIds;
    if (codes?.length) {
      const categoryDocs = await resolveCategoryDocs(codes, req.body.categoryDescription);
      nextIds = categoryDocs.map((c) => c._id);
      recipe.categories = nextIds;
    }

    Object.assign(recipe, patch);
    await recipe.save();

    if (codes?.length && !sameIdSet(prevIds, nextIds)) {
      await unlinkRecipeFromCategories(recipe._id, prevIds);
      await linkRecipeToCategories(recipe._id, nextIds);
    }

    const populated = await Recipe.findById(recipe._id)
      .populate('categories', 'code description')
      .populate('addedBy', 'username email');

    return res.status(200).json(populated);
  } catch (err) {
    return next(err);
  }
};

const deleteRecipe = async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return next({ status: 404, message: 'Recipe not found' });
    if (!canManageRecipe(recipe, req.user)) return next({ status: 403, message: 'Forbidden' });

    const ids = recipe.categories.map((id) => id);
    await Recipe.deleteOne({ _id: recipe._id });
    await unlinkRecipeFromCategories(recipe._id, ids);

    return res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getRecipes,
  getRecipeById,
  getRecipesByPreparationTime,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
