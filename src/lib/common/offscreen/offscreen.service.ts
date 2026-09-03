import { inject, injectable } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { Logger } from 'extension/common/logging/logger';
import { LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { MessageType } from 'extension/common/message/message-type.enum';
import { MessageService, MessageServiceToken } from 'extension/common/message/message.service';

const OffscreenServiceName = 'OffscreenService';

export const OffscreenServiceToken = Symbol(OffscreenServiceName);

/**
 * Orchestrates all communication with the offscreen document.
 *
 * Only a single offscreen document can exist per extension at any given time, so every feature depending on DOM APIs
 * that are unavailable to the service worker (e.g. the clipboard, HTML parsing, geolocation) shares the one document
 * created here. Requests are reference counted so that the document is only created for the first request and is only
 * closed once the last concurrent request has completed.
 */
@injectable()
export class OffscreenService {
  private static readonly JUSTIFICATION =
    'Access DOM APIs that are unavailable to the service worker in order to execute templates';
  private static readonly PATH = 'offscreen.html';
  private static readonly REASONS: `${browser.offscreen.Reason}`[] = ['CLIPBOARD', 'DOM_PARSER', 'GEOLOCATION'];

  private readonly logger: Logger;
  private closing: Promise<void> | undefined;
  private creating: Promise<void> | undefined;
  private pendingRequests = 0;

  constructor(
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(LoggingServiceToken) loggingService: LoggingService,
    @inject(MessageServiceToken) private readonly messageService: MessageService,
  ) {
    this.logger = loggingService.createLogger(OffscreenServiceName);
  }

  async sendMessageAndAwaitReply<D = unknown, R = unknown>(type: MessageType, data: D): Promise<R> {
    this.pendingRequests++;

    try {
      await this.createDocument();

      return await this.messageService.sendMessageAndAwaitReply<D, R>(type, data);
    } finally {
      this.pendingRequests--;

      await this.closeDocument();
    }
  }

  private async closeDocument(): Promise<void> {
    if (this.pendingRequests > 0) {
      return;
    }

    this.closing ??= browser.offscreen.closeDocument();

    try {
      await this.closing;
    } catch (e) {
      this.logger.warn('Failed to close offscreen document:', e);
    } finally {
      this.closing = undefined;
    }
  }

  private async createDocument(): Promise<void> {
    // Wait for any in-flight closure to settle first, otherwise the document could be created while it is being
    // closed, leaving requests to be sent to a document that is about to disappear.
    await this.closing?.catch(() => undefined);

    if (await this.hasDocument()) {
      return;
    }

    this.creating ??= browser.offscreen.createDocument({
      justification: OffscreenService.JUSTIFICATION,
      reasons: OffscreenService.REASONS,
      url: OffscreenService.PATH,
    });

    try {
      await this.creating;
    } finally {
      this.creating = undefined;
    }
  }

  private async hasDocument(): Promise<boolean> {
    const contexts = await browser.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [this.extensionInfo.createExtensionUrlString(OffscreenService.PATH)],
    });

    return contexts.length > 0;
  }
}
