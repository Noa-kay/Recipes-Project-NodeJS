const path = require('path');
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

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/recipes', recipeRoutes);
app.use('/categories', categoryRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/categories', categoryRoutes);

/** דף מתכונים (צד לקוח) — אחרי ה-API כדי שלא ייחסם נתיבים. */
app.use(
  express.static(path.join(__dirname, '..', 'public'), {
    index: 'index.html',
  })
);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
