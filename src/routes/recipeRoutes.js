const express = require('express');
const {
  getRecipes,
  getRecipeById,
  getRecipesByPreparationTime,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} = require('../controllers/recipeController');
const { authRequired, authOptional } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createRecipeSchema, updateRecipeSchema } = require('../validations/recipeValidation');

const router = express.Router();

router.get('/', authOptional, getRecipes);
router.get('/max-time/:minutes', authOptional, getRecipesByPreparationTime);
router.get('/:id', authOptional, getRecipeById);
router.post('/', authRequired, validate(createRecipeSchema), createRecipe);
router.put('/:id', authRequired, validate(updateRecipeSchema), updateRecipe);
router.delete('/:id', authRequired, deleteRecipe);

module.exports = router;
