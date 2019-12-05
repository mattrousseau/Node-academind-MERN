const uuid = require('uuid/v4');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');

// ------------------------------------
// Get place by ID
// ------------------------------------
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(
      new HttpError('Something went wrong, could not find a place.', 500)
    );
  }

  if (!place) {
    return next(
      new HttpError('Could not find a place for the provided id.', 404)
    );
  }

  res.json({ place: place.toObject({ getters: true }) });
};

// ------------------------------------
// Get all places for one user
// ------------------------------------
const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;

  try {
    places = await Place.find({ creator: userId });
  } catch (error) {
    return next(
      new HttpError('Something went wrong, could not fetch places.', 500)
    );
  }

  if (!places || places.length === 0) {
    return next(
      new HttpError('could not find a place for the provided user id', 404)
    );
  }

  places = places.map(place => place.toObject({ getters: true }));

  res.json({ places });
};

// ------------------------------------
// Create a place
// ------------------------------------
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessage = errors.array({ onlyFirstError: true })[0].msg;
    const errorInput = errors.array({ onlyFirstError: true })[0].param;
    return next(new HttpError(`${errorInput}: ${errorMessage}`, 422));
  }

  const { title, description, address, creator } = req.body;

  let location;
  try {
    location = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location,
    image:
      'https://www.google.com/url?sa=i&source=images&cd=&ved=2ahUKEwj098CI7ZzmAhUSmRoKHaX5BUoQjRx6BAgBEAQ&url=https%3A%2F%2Funsplash.com%2Fs%2Fphotos%2Fempire-state-building&psig=AOvVaw0x_BeCat7KdRC2Rqx3LZPR&ust=1575578400237282',
    creator
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    return next(new HttpError('Creating a place failed!', 500));
  }

  if (!user) {
    return next(
      new HttpError('We could not find a user with the provided id.', 404)
    );
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    return next(new HttpError('Creating place failed', 500));
  }

  res.status(201).json({ place: createdPlace });
};

// ------------------------------------
// Update a place
// ------------------------------------
const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessage = errors.array({ onlyFirstError: true })[0].msg;
    const errorInput = errors.array({ onlyFirstError: true })[0].param;
    return next(new HttpError(`${errorInput}: ${errorMessage}`, 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(
      new HttpError('Something went wrong, could not update place.', 500)
    );
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (error) {
    return next(
      new HttpError('Something went wrong, could not update place.', 500)
    );
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

// ------------------------------------
// Delete a place
// ------------------------------------
const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (error) {
    return next(
      new HttpError('Something went wrong, could not delete this place.', 500)
    );
  }

  if (!place) {
    return next(new HttpError('We could not find a place for this id.', 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    return next(new HttpError('Deleting place failed', 500));
  }

  res.status(200).json({ message: 'deleted place!' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.deletePlace = deletePlace;
exports.updatePlaceById = updatePlaceById;
