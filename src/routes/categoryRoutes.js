const express = require('express');
const { getCategories, getCategoriesWithRecipes, getCategoryByCodeOrName } = require('../controllers/categoryController');

const router = express.Router();

router.get('/', getCategories);
router.get('/with-recipes', getCategoriesWithRecipes);
router.get('/:key', getCategoryByCodeOrName);

module.exports = router;
