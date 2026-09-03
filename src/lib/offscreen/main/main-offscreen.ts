import { injectable, multiInject } from 'extension/common/di';
import { MessageListener, MessageListenerToken } from 'extension/common/message/message-listener';
import { Offscreen } from 'extension/offscreen/offscreen';

@injectable()
export class MainOffscreen implements Offscreen {
  constructor(@multiInject(MessageListenerToken) private readonly messageListeners: MessageListener[]) {}

  run() {
    this.messageListeners.forEach((messageListener) => messageListener.listen());
  }
}
