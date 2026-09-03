import { inject, injectable } from 'extension/common/di';
import { type GeolocationCoords } from 'extension/common/geolocation/geolocation.schema';
import {
  type GeolocationMessageInput,
  type GeolocationMessageOutput,
} from 'extension/common/geolocation/message/geolocation-message.schema';
import { type Logger } from 'extension/common/logging/logger';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type OffscreenService, OffscreenServiceToken } from 'extension/common/offscreen/offscreen.service';

export const GeolocationServiceToken = Symbol('GeolocationService');

/**
 * Provides the geolocation of the client.
 *
 * `navigator.geolocation` is unavailable to the service worker, so implementations either read it directly (where
 * available) or delegate to the offscreen document.
 */
export interface GeolocationService {
  getCoords(): Promise<GeolocationCoords | undefined>;
}

/**
 * Reads the geolocation of the client using `navigator.geolocation`, which is only available within a document (e.g.
 * the offscreen document) and never within the service worker.
 */
@injectable()
export class NavigatorGeolocationService implements GeolocationService {
  private static readonly TIMEOUT = 5000;

  private readonly logger: Logger;

  constructor(@inject(LoggingServiceToken) logging: LoggingService) {
    this.logger = logging.getLogger('NavigatorGeolocationService');
  }

  async getCoords(): Promise<GeolocationCoords | undefined> {
    this.logger.trace('Attempting to retrieve geolocation');

    try {
      const { coords } = await new Promise<GeolocationPosition>((resolve, reject) => {
        // A `timeout` is required so this always settles - without one, an unanswered permission prompt would otherwise
        // leave this (and therefore the entire reply) pending forever.
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: NavigatorGeolocationService.TIMEOUT });
      });

      this.logger.debug('Successfully retrieved geolocation:', coords);

      return {
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        latitude: coords.latitude,
        longitude: coords.longitude,
        speed: coords.speed,
      };
    } catch (e) {
      // Permission denied, unavailable, or timed out - fall back to no coordinates being available.
      this.logger.error('Failed to retrieve geolocation:', e);
      return;
    }
  }
}

/** Reads the geolocation of the client by delegating to the offscreen document. */
@injectable()
export class OffscreenGeolocationService implements GeolocationService {
  private readonly logger: Logger;

  constructor(
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(OffscreenServiceToken) private readonly offscreenService: OffscreenService,
  ) {
    this.logger = logging.getLogger('OffscreenGeolocationService');
  }

  async getCoords(): Promise<GeolocationCoords | undefined> {
    this.logger.trace('Attempting to retrieve geolocation');

    const { coords } = await this.offscreenService.sendMessageAwaitResponse<
      GeolocationMessageInput,
      GeolocationMessageOutput
    >(MessageType.Geolocation, {});

    if (coords) {
      this.logger.debug('Successfully retrieved geolocation:', coords);
      return coords;
    }

    this.logger.warn('Failed to retrieve geolocation');
    return;
  }
}
