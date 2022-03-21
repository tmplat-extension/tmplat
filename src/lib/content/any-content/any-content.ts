import { inject, injectable, multiInject } from 'extension/common/di';
import { EventListener, EventListenerToken } from 'extension/common/event/event-listener';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { MessageListener, MessageListenerToken } from 'extension/common/message/message-listener';
import { Content } from 'extension/content/content';

@injectable()
export class AnyContent implements Content {
  constructor(
    @multiInject(EventListenerToken) private readonly eventListeners: EventListener[],
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @multiInject(MessageListenerToken) private readonly messageListeners: MessageListener[],
  ) {}

  inject() {
    if (this.hasInjectionMarker()) {
      return;
    }

    this.addInjectionMarker();

    this.eventListeners.forEach((eventListener) => eventListener.listen());
    this.messageListeners.forEach((messageListener) => messageListener.listen());
  }

  private addInjectionMarker() {
    document.body.setAttribute(this.injectionMarkerName, this.injectionMarkerValue);
  }

  private hasInjectionMarker(): boolean {
    return document.body.getAttribute(this.injectionMarkerName) === this.injectionMarkerValue;
  }

  private get injectionMarkerName(): string {
    return `data-extension-${this.extensionInfo.currentId}`;
  }

  private get injectionMarkerValue(): string {
    return this.extensionInfo.versionHash;
  }
}
