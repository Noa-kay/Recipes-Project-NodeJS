const express = require('express');
const { getCategories, getCategoriesWithRecipes, getCategoryByCodeOrName } = require('../controllers/categoryController');
const { authOptional } = require('../middlewares/auth');

const router = express.Router();

router.get('/', getCategories);
router.get('/with-recipes', authOptional, getCategoriesWithRecipes);
router.get('/:key', authOptional, getCategoryByCodeOrName);

module.exports = router;
