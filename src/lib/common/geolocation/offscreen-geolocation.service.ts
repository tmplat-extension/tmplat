import { inject, injectable } from 'extension/common/di';
import { GeolocationCoords } from 'extension/common/geolocation/geolocation.model';
import { GeolocationService } from 'extension/common/geolocation/geolocation.service';
import { GetGeolocationMessageReply } from 'extension/common/geolocation/message/get-geolocation-message.model';
import { MessageType } from 'extension/common/message/message-type.enum';
import { OffscreenService, OffscreenServiceToken } from 'extension/common/offscreen/offscreen.service';

/** Reads the geolocation of the client by delegating to the offscreen document. */
@injectable()
export class OffscreenGeolocationService extends GeolocationService {
  constructor(@inject(OffscreenServiceToken) private readonly offscreenService: OffscreenService) {
    super();
  }

  async getCoords(): Promise<GeolocationCoords | undefined> {
    const { coords } = await this.offscreenService.sendMessageAndAwaitReply<null, GetGeolocationMessageReply>(
      MessageType.GetGeolocation,
      null,
    );

    return coords ?? undefined;
  }
}
