const HttpError = require('../models/http-error');
const uuid = require('uuid/v4');

let DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Empire State Buildind',
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

  if (places === undefined || places.length == 0) {
    return next(
      new HttpError('could not find a place for the provided user id', 404)
    );
  }

  res.json({ places });
};

const createPlace = (req, res, next) => {
  const { title, description, coordinates, address, creator } = req.body;
  // const title = req.body.title;
  const createdPlace = {
    id: uuid(),
    title,
    description,
    location: coordinates,
    address,
    creator
  };

  DUMMY_PLACES.push(createdPlace); //unshift(createdPlace)

  res.status(201).json({ place: createdPlace });
};

const updatePlaceById = (req, res, next) => {
  const placeId = req.params.pid;
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
  DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);

  res.status(200).json({ message: 'deleted place!' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.deletePlace = deletePlace;
exports.updatePlaceById = updatePlaceById;
