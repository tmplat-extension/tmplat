import {
  GeolocationMessageInputSchema,
  GeolocationMessageOutputSchema,
} from 'extension/common/geolocation/message/geolocation-message.schema';
import { defineMessageConfigWithResponse } from 'extension/common/message/message-config';
import { MessageType } from 'extension/common/message/message-type.enum';

export const GeolocationMessageConfig = defineMessageConfigWithResponse(MessageType.Geolocation, {
  input: GeolocationMessageInputSchema,
  output: GeolocationMessageOutputSchema,
});
