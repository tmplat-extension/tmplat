import { inject, injectable, multiInject } from 'extension/common/di';
import { ExtensionManager, ExtensionManagerToken } from 'extension/common/extension-manager';
import { MessageListener, MessageListenerToken } from 'extension/common/message/message-listener';
import { Worker } from 'extension/worker/worker';

@injectable()
export class BackgroundWorker implements Worker {
  constructor(
    @multiInject(MessageListenerToken) private readonly messageListeners: MessageListener[],
    @inject(ExtensionManagerToken) private readonly extensionManager: ExtensionManager,
  ) {}

  async run(): Promise<void> {
    this.messageListeners.forEach((messageListener) => messageListener.listen());

    await this.extensionManager.run();
  }
}
