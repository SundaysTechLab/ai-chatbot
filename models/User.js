// models/User.js

const mongoose = require('mongoose');

// Define the User schema and model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, required: false }, // Make phoneNumber optional
  address: { type: String, required: false }, // Make address optional
  role: { type: String, default: 'user' }, // Default role is 'user'
  // isAdmin: {
    //  type: Boolean,
    //  default: false
  // }
});

module.exports = mongoose.model('User', userSchema);