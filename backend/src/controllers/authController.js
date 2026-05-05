const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');

// POST /api/auth/signup
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return errorResponse(res, 'Email already in use', 409);

    // First user ever becomes admin, everyone else is member
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : 'member';

    const user = await User.create({ name, email, password, role: assignedRole });
    const token = generateToken(user._id);

    return successResponse(res, { user, token }, 'Account created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) return errorResponse(res, 'Invalid email or password', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return errorResponse(res, 'Invalid email or password', 401);

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    return successResponse(res, { user, token }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  return successResponse(res, { user: req.user }, 'User fetched');
};

// PUT /api/auth/me
exports.updateMe = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const update = {};
    if (name) update.name = name;
    if (password) {
      const user = await User.findById(req.user._id);
      user.password = password;
      await user.save();
      const token = generateToken(user._id);
      return successResponse(res, { user, token }, 'Profile updated');
    }

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    return successResponse(res, { user }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};
