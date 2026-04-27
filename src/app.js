const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(
  cors({
    origin: env.clientOrigin === '*' ? true : env.clientOrigin,
    credentials: true,
  })
);
app.use(express.json());

const healthHandler = (_req, res) => {
  res.status(200).json({ status: 'ok' });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

/** Root: assignment is API + Postman/Thunder — no full browser UI. */
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Recipes REST API. Test with Postman or Thunder Client.',
    collection: 'postman/Recipes-API.postman_collection.json',
    paths: {
      health: '/health',
      auth: '/auth',
      users: '/users',
      recipes: '/recipes',
      categories: '/categories',
      legacyApiPrefix: '/api/* (same routes)',
    },
  });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/recipes', recipeRoutes);
app.use('/categories', categoryRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/categories', categoryRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
