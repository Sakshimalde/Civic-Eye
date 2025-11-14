import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // Full name of the user
  },
  email: {
    type: String,
    required: true,
    unique: true, // Email address
  },
  password: {
    type: String,
    required: true, // Hashed password
  },
  location: {
    type: String,
    required: true, // User's geographic area
  },
  role: {
    type: String,
    enum: ['user', 'volunteer', 'admin'],
    default: 'user',
  },
  profilePhoto: {
    type: String,
    default: '', // Link to profile image
  },
  resetPasswordToken: String,
resetPasswordExpires: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
  refreshToken: {
    type: String,
    default: '',
  }
});

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      role: this.role,
      email: this.email,
      name: this.name,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

// Method to generate Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model('User', userSchema);
