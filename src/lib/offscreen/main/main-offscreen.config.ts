import { CopyMessageConfig } from 'extension/common/clipboard/message/copy-message-config';
import { CopyMessageListener } from 'extension/common/clipboard/message/copy-message-listener';
import { Container } from 'extension/common/di';
import { GeolocationServiceToken, NavigatorGeolocationService } from 'extension/common/geolocation/geolocation.service';
import { GeolocationMessageConfig } from 'extension/common/geolocation/message/geolocation-message-config';
import { GeolocationMessageListener } from 'extension/common/geolocation/message/geolocation-message-listener';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { EuropaMarkdownService, MarkdownServiceToken } from 'extension/common/markdown/markdown.service';
import { ConvertMarkdownMessageConfig } from 'extension/common/markdown/message/convert-markdown-message-config';
import { ConvertMarkdownMessageListener } from 'extension/common/markdown/message/convert-markdown-message-listener';
import { MessageConfigToken } from 'extension/common/message/message-config';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageListenerToken } from 'extension/common/message/message-listener';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import { MainOffscreen } from 'extension/offscreen/main/main-offscreen';
import { OffscreenToken } from 'extension/offscreen/offscreen';

const container = new Container({
  defaultScope: 'Singleton',
  jitless: true,
});
container.bind(GeolocationServiceToken).to(NavigatorGeolocationService);
container.bind(LoggingServiceToken).to(LoggingService);
container.bind(MarkdownServiceToken).to(EuropaMarkdownService);
container.bind(MessageConfigToken).toConstantValue(ConvertMarkdownMessageConfig);
container.bind(MessageConfigToken).toConstantValue(CopyMessageConfig);
container.bind(MessageConfigToken).toConstantValue(GeolocationMessageConfig);
container.bind(MessageIdGeneratorToken).to(MessageIdGenerator);
container.bind(MessageListenerToken).to(ConvertMarkdownMessageListener);
container.bind(MessageListenerToken).to(CopyMessageListener);
container.bind(MessageListenerToken).to(GeolocationMessageListener);
container.bind(MessageServiceToken).to(MessageService);
container.bind(OffscreenToken).to(MainOffscreen);
container.bind(ValidationServiceToken).to(ValidationService);

export { container };
