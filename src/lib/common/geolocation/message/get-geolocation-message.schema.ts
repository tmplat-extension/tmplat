import Joi from 'joi';
import { GeolocationCoords } from 'extension/common/geolocation/geolocation.model';
import { GetGeolocationMessageReply } from 'extension/common/geolocation/message/get-geolocation-message.model';

export const getGeolocationMessageSchema = Joi.any().valid(null);

export const getGeolocationMessageReplyCoordsSchema = Joi.object<GeolocationCoords>({
  accuracy: Joi.number().required(),
  altitude: Joi.number().allow(null).required(),
  altitudeAccuracy: Joi.number().allow(null).required(),
  heading: Joi.number().allow(null).required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  speed: Joi.number().allow(null).required(),
});

export const getGeolocationMessageReplySchema = Joi.object<GetGeolocationMessageReply>({
  coords: getGeolocationMessageReplyCoordsSchema.allow(null).required(),
});
