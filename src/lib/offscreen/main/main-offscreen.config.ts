import { CopyMessageListener } from 'extension/common/clipboard/message/copy-message-listener';
import { Container } from 'extension/common/di';
import { GeolocationService, GeolocationServiceToken } from 'extension/common/geolocation/geolocation.service';
import { GetGeolocationMessageListener } from 'extension/common/geolocation/message/get-geolocation-message-listener';
import { NavigatorGeolocationService } from 'extension/common/geolocation/navigator-geolocation.service';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { EuropaMarkdownService } from 'extension/common/markdown/europa-markdown.service';
import { MarkdownService, MarkdownServiceToken } from 'extension/common/markdown/markdown.service';
import { ConvertMarkdownMessageListener } from 'extension/common/markdown/message/convert-markdown-message-listener';
import { MessageIdGenerator, MessageIdGeneratorToken } from 'extension/common/message/message-id-generator';
import { MessageListener, MessageListenerToken } from 'extension/common/message/message-listener';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';
import { MainOffscreen } from 'extension/offscreen/main/main-offscreen';
import { Offscreen, OffscreenToken } from 'extension/offscreen/offscreen';

const container = new Container({
  defaultScope: 'Singleton',
  jitless: true,
});
container.bind<GeolocationService>(GeolocationServiceToken).to(NavigatorGeolocationService);
container.bind<LoggingService>(LoggingServiceToken).to(LoggingService);
container.bind<MarkdownService>(MarkdownServiceToken).to(EuropaMarkdownService);
container.bind<MessageIdGenerator>(MessageIdGeneratorToken).to(MessageIdGenerator);
container.bind<MessageListener>(MessageListenerToken).to(ConvertMarkdownMessageListener);
container.bind<MessageListener>(MessageListenerToken).to(CopyMessageListener);
container.bind<MessageListener>(MessageListenerToken).to(GetGeolocationMessageListener);
container.bind<MessageService>(MessageServiceToken).to(MessageService);
container.bind<Offscreen>(OffscreenToken).to(MainOffscreen);

export { container };
