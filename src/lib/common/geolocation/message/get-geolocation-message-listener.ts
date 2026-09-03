import { inject, injectable } from 'extension/common/di';
import { GeolocationService, GeolocationServiceToken } from 'extension/common/geolocation/geolocation.service';
import { GetGeolocationMessageReply } from 'extension/common/geolocation/message/get-geolocation-message.model';
import {
  getGeolocationMessageReplySchema,
  getGeolocationMessageSchema,
} from 'extension/common/geolocation/message/get-geolocation-message.schema';
import { ReturnMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';

@injectable()
export class GetGeolocationMessageListener extends ReturnMessageListener<unknown, GetGeolocationMessageReply> {
  constructor(
    @inject(GeolocationServiceToken) private readonly geolocationService: GeolocationService,
    @inject(MessageServiceToken) messageService: MessageService,
  ) {
    super(
      {
        schemas: {
          message: getGeolocationMessageSchema,
          reply: getGeolocationMessageReplySchema,
        },
        type: MessageType.GetGeolocation,
      },
      messageService,
    );
  }

  protected async onMessage(): Promise<GetGeolocationMessageReply> {
    return { coords: (await this.geolocationService.getCoords()) ?? null };
  }
}
