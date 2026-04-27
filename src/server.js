const app = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');

const startServer = async () => {
  try {
    if (!env.jwtSecret) {
      throw new Error('JWT_SECRET is required in environment variables');
    }

    await connectDb();
    app.listen(env.port, () => {
      console.log(`Server is running on port ${env.port}`);
    });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

startServer();
