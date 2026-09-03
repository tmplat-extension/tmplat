import { GeolocationCoords } from 'extension/common/geolocation/geolocation.model';

export const GeolocationServiceToken = Symbol('GeolocationService');

/**
 * Provides the geolocation of the client.
 *
 * `navigator.geolocation` is unavailable to the service worker, so implementations either read it directly (where
 * available) or delegate to the offscreen document.
 */
export abstract class GeolocationService {
  abstract getCoords(): Promise<GeolocationCoords | undefined>;
}
