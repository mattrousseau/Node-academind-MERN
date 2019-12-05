const axios = require('axios');

const HttpError = require('../models/http-error');

const getCoordsForAddress = async address => {
  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${process.env.MAPBOX_API_KEY}`
  );

  const mapboxData = response.data;

  if (!mapboxData || mapboxData.features.length === 0) {
    throw new HttpError(
      'Could not find a location based on the provided address',
      404
    );
  }

  const coordsArray = mapboxData.features[0].center;

  return { lat: coordsArray[1], lng: coordsArray[0] };
};

module.exports = getCoordsForAddress;
