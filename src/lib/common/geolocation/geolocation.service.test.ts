import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type GeolocationCoords } from 'extension/common/geolocation/geolocation.schema';
import {
  NavigatorGeolocationService,
  OffscreenGeolocationService,
} from 'extension/common/geolocation/geolocation.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type OffscreenService } from 'extension/common/offscreen/offscreen.service';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';

const COORDS: GeolocationCoords = {
  accuracy: 10,
  altitude: 100,
  altitudeAccuracy: 5,
  heading: 90,
  latitude: 51.5,
  longitude: -0.12,
  speed: 1.5,
};

describe('NavigatorGeolocationService', () => {
  let getCurrentPosition: ReturnType<typeof vi.fn>;
  let logging: LoggingServiceMock;
  let service: NavigatorGeolocationService;

  beforeEach(() => {
    getCurrentPosition = vi.fn();
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
    logging = createLoggingServiceMock();
    service = new NavigatorGeolocationService(logging as unknown as LoggingService);
  });

  const resolvePosition = (coords: GeolocationCoords) => {
    getCurrentPosition.mockImplementation((success: (position: { coords: GeolocationCoords }) => void) => {
      success({ coords });
    });
  };

  describe('getCoords', () => {
    it('resolves the coordinates reported by the browser', async () => {
      resolvePosition(COORDS);

      await expect(service.getCoords()).resolves.toEqual(COORDS);
    });

    it('copies only the known coordinate fields, ignoring any extras on the position', async () => {
      getCurrentPosition.mockImplementation((success: (position: { coords: unknown }) => void) => {
        success({ coords: { ...COORDS, extra: 'ignored', toJSON: () => ({}) } });
      });

      await expect(service.getCoords()).resolves.toEqual(COORDS);
    });

    it('requests the position with a timeout so an unanswered permission prompt cannot hang forever', async () => {
      resolvePosition(COORDS);

      await service.getCoords();

      expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), { timeout: 5000 });
    });

    it('resolves undefined when the browser reports an error rather than rejecting', async () => {
      getCurrentPosition.mockImplementation((_success: unknown, error: (e: unknown) => void) => {
        error({ code: 1, message: 'User denied Geolocation' });
      });

      await expect(service.getCoords()).resolves.toBeUndefined();
    });
  });
});

describe('OffscreenGeolocationService', () => {
  let logging: LoggingServiceMock;
  let sendMessageAwaitResponse: ReturnType<typeof vi.fn>;
  let service: OffscreenGeolocationService;

  beforeEach(() => {
    logging = createLoggingServiceMock();
    sendMessageAwaitResponse = vi.fn();
    const offscreenService = { sendMessageAwaitResponse } as unknown as OffscreenService;
    service = new OffscreenGeolocationService(logging as unknown as LoggingService, offscreenService);
  });

  describe('getCoords', () => {
    it('delegates to the offscreen document with a geolocation message', async () => {
      sendMessageAwaitResponse.mockResolvedValue({ coords: COORDS });

      await service.getCoords();

      expect(sendMessageAwaitResponse).toHaveBeenCalledWith(MessageType.Geolocation, {});
    });

    it('resolves the coordinates returned by the offscreen document', async () => {
      sendMessageAwaitResponse.mockResolvedValue({ coords: COORDS });

      await expect(service.getCoords()).resolves.toEqual(COORDS);
    });

    it('resolves undefined when the offscreen document has no coordinates to report', async () => {
      sendMessageAwaitResponse.mockResolvedValue({ coords: undefined });

      await expect(service.getCoords()).resolves.toBeUndefined();
    });

    it('propagates a rejection from the offscreen document', async () => {
      sendMessageAwaitResponse.mockRejectedValue(new Error('offscreen unavailable'));

      await expect(service.getCoords()).rejects.toThrow('offscreen unavailable');
    });
  });
});
