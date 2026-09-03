import { GeolocationCoords } from 'extension/common/geolocation/geolocation.model';

export type GetGeolocationMessageReply = {
  readonly coords: GeolocationCoords | null;
};
