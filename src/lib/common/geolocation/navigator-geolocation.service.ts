import { injectable } from 'extension/common/di';
import { GeolocationCoords } from 'extension/common/geolocation/geolocation.model';
import { GeolocationService } from 'extension/common/geolocation/geolocation.service';

/**
 * Reads the geolocation of the client using `navigator.geolocation`, which is only available within a document (e.g.
 * the offscreen document) and never within the service worker.
 */
@injectable()
export class NavigatorGeolocationService extends GeolocationService {
  private static readonly TIMEOUT = 5000;

  async getCoords(): Promise<GeolocationCoords | undefined> {
    if (!navigator.geolocation) {
      return undefined;
    }

    try {
      const { coords } = await new Promise<GeolocationPosition>((resolve, reject) => {
        // A `timeout` is required so this always settles - without one, an unanswered permission prompt would
        // otherwise leave this (and therefore the entire reply) pending forever.
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: NavigatorGeolocationService.TIMEOUT });
      });

      return {
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        latitude: coords.latitude,
        longitude: coords.longitude,
        speed: coords.speed,
      };
    } catch (_) {
      // Permission denied, unavailable, or timed out - fall back to no coordinates being available.
      return undefined;
    }
  }
}
