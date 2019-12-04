const HttpError = require('../models/http-error');
const uuid = require('uuid/v4');
const { validationResult } = require('express-validator');

const DUMMY_USERS = [
  {
    id: 'u1',
    email: 'toto@gmail.com',
    password: '213131',
    name: 'toto'
  },
  {
    id: 'u2',
    email: 'matt@titi.com',
    password: '213131',
    name: 'matt'
  }
];

const getUsers = (req, res, next) => {
  res.json({ users: DUMMY_USERS });
};

const signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessage = errors.array({ onlyFirstError: true })[0].msg;
    const errorInput = errors.array({ onlyFirstError: true })[0].param;
    throw new HttpError(`${errorInput}: ${errorMessage}`, 422);
  }

  const { name, email, password } = req.body;

  const existingUser = DUMMY_USERS.find(u => u.email === email);

  if (existingUser) {
    throw new HttpError('email already exist', 422);
  } else {
    const createdUser = {
      id: uuid(),
      name,
      email,
      password
    };

    DUMMY_USERS.push(createdUser);

    res.status(201).json({ user: createdUser });
  }
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  const identifiedUser = DUMMY_USERS.find(u => u.email === email);
  if (!identifiedUser || identifiedUser.password !== password) {
    throw new HttpError('could not identified user, wrong credentials', 401);
  }

  res.json({ message: 'Succefully logged in' });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
