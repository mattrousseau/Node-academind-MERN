const uuid = require('uuid/v4');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

// ------------------------------------
// Get all users
// ------------------------------------
const getUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}, '-password');
  } catch (error) {
    return next(new HttpError('Fetching users failed!', 500));
  }

  users = users.map(user => user.toObject({ getters: true }));

  res.json({ users });
};

// ------------------------------------
// SIGN UP
// ------------------------------------
const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessage = errors.array({ onlyFirstError: true })[0].msg;
    const errorInput = errors.array({ onlyFirstError: true })[0].param;
    return next(new HttpError(`${errorInput}: ${errorMessage}`, 422));
  }

  const { name, email, password, image } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    return next(new HttpError('Signing up failed!', 500));
  }

  if (existingUser) {
    return next(new HttpError('Email already exist: please login.', 422));
  } else {
    const user = new User({
      name,
      email,
      password,
      image:
        'https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwjhzN-PmZ3mAhUH1hoKHVSFAOYQjRx6BAgBEAQ&url=https%3A%2F%2Fwww.ladbible.com%2Fcommunity%2Fviral-weird-sport-fail-six-years-ago-a-sporting-event-played-borats-fake-kazakhstan-anthem-20180323&psig=AOvVaw0T7Z4MF_0u0Ic7kiTRBHBv&ust=1575590225614210',
      places: []
    });

    try {
      await user.save();
    } catch (error) {
      return next('Signing up failed!', 500);
    }

    res.status(201).json({ user: user.toObject({ getters: true }) });
  }
};

// ------------------------------------
// LOGIN
// ------------------------------------
const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    return next(new HttpError('Could not identify user.', 500));
  }

  if (!existingUser || existingUser.password !== password) {
    return next(new HttpError('Could not log in, wrong credentials.', 401));
  }
  res.json({ message: 'Succefully logged in!' });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
