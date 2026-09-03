import { inject, injectable } from 'extension/common/di';
import { type GeolocationService, GeolocationServiceToken } from 'extension/common/geolocation/geolocation.service';
import {
  type GeolocationMessageInput,
  type GeolocationMessageOutput,
} from 'extension/common/geolocation/message/geolocation-message.schema';
import { RespondingMessageListener } from 'extension/common/message/message-listener';
import { MessageType } from 'extension/common/message/message-type.enum';
import { type MessageService, MessageServiceToken } from 'extension/common/message/message.service';

@injectable()
export class GeolocationMessageListener extends RespondingMessageListener<
  GeolocationMessageInput,
  GeolocationMessageOutput
> {
  constructor(
    @inject(GeolocationServiceToken) private readonly geolocationService: GeolocationService,
    @inject(MessageServiceToken) messageService: MessageService,
  ) {
    super(messageService, MessageType.Geolocation);
  }

  protected async onMessage(_input: GeolocationMessageInput): Promise<GeolocationMessageOutput> {
    const coords = await this.geolocationService.getCoords();
    return { coords: coords ?? null };
  }
}
