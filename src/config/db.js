const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const env = require('./env');

let memoryServer;

const connectDb = async () => {
  let uri = env.mongoUri;

  if (!uri && env.useMemoryDb) {
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: 'recipes_db' },
      binary: { version: '6.0.14' },
    });
    uri = memoryServer.getUri();
    console.warn('[db] Using MongoMemoryServer. For Atlas, set MONGO_URI and USE_MEMORY_DB=false.');
  }

  if (!uri) {
    throw new Error('Set MONGO_URI or USE_MEMORY_DB=true in .env');
  }

  await mongoose.connect(uri);
};

const closeDb = async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
};

module.exports = { connectDb, closeDb };
