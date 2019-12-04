const HttpError = require('../models/http-error');
const uuid = require('uuid/v4');
const { validationResult } = require('express-validator');
const getCoordsForAddress = require('../util/location');

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

const getPlaceById = (req, res, next) => {
  const placeId = req.params.pid;

  const place = DUMMY_PLACES.find(p => p.id === placeId);

  if (!place) {
    throw new HttpError('could not find a place for the provided id', 404);
  }

  res.json({ place });
};

const getPlacesByUserId = (req, res, next) => {
  const userId = req.params.uid;

  const places = DUMMY_PLACES.filter(place => place.creator === userId);

  if (!places || places.length === 0) {
    return next(
      new HttpError('could not find a place for the provided user id', 404)
    );
  }

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
  console.log(location);

  const createdPlace = {
    id: uuid(),
    title,
    description,
    location,
    address,
    creator
  };

  DUMMY_PLACES.push(createdPlace); //unshift(createdPlace)

  res.status(201).json({ place: createdPlace });
};

const updatePlaceById = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessage = errors.array({ onlyFirstError: true })[0].msg;
    const errorInput = errors.array({ onlyFirstError: true })[0].param;
    throw new HttpError(`${errorInput}: ${errorMessage}`, 422);
  }

  const { title, description } = req.body;

  const updatedPlace = {
    ...DUMMY_PLACES.find(p => p.id == placeId),
    title,
    description
  };
  const placeIndex = DUMMY_PLACES.findIndex(p => p.id == placeId);
  updatedPlace.title = title;
  updatedPlace.description = description;

  DUMMY_PLACES[placeIndex] = updatedPlace;

  res.status(200).json({ place: updatedPlace });
};

const deletePlace = (req, res, next) => {
  const placeId = req.params.pid;
  if (!DUMMY_PLACES.find(p => p.id === placeId)) {
    throw new HttpError('Place not found for that id', 404);
  }

  DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);

  res.status(200).json({ message: 'deleted place!' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.deletePlace = deletePlace;
exports.updatePlaceById = updatePlaceById;
