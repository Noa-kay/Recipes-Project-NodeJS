const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
})

module.exports = mongoose.model('User', userSchema)
