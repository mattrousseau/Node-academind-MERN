const HttpError = require('../models/http-error');
const uuid = require('uuid/v4');
const { validationResult } = require('express-validator');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');

let DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Empire State Building',
    description: 'One of the most famous skyscraper in the world!',
    location: {
      lat: 40.7484,
      lng: -73.9857
    },
    address: '20 W 34th St, New York, NY 10001, United States',
    creator: 'u1'
  },
  {
    id: 'p2',
    title: 'Tour Eiffel',
    description: 'Paris most iconic monument',
    location: {
      lat: 48.8584,
      lng: 2.2945
    },
    address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
    creator: 'u1'
  }
];

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
    throw new HttpError('Could not find a place for the provided id.', 404);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

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

  try {
    await createdPlace.save();
  } catch (error) {
    return next(new HttpError('Creating place failed', 500));
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlaceById = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessage = errors.array({ onlyFirstError: true })[0].msg;
    const errorInput = errors.array({ onlyFirstError: true })[0].param;
    throw new HttpError(`${errorInput}: ${errorMessage}`, 422);
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

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(
      new HttpError('Something went wrong, could not delete this place.', 500)
    );
  }

  try {
    await place.remove();
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
