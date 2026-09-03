import { injectable, multiInject } from 'extension/common/di';
import { type MessageListener, MessageListenerToken } from 'extension/common/message/message-listener';
import { type Offscreen } from 'extension/offscreen/offscreen';

@injectable()
export class MainOffscreen implements Offscreen {
  constructor(@multiInject(MessageListenerToken) private readonly messageListeners: MessageListener[]) {}

  run() {
    this.messageListeners.forEach((messageListener) => messageListener.listen());
  }
}
