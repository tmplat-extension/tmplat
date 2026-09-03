import { defineMessageConfig, defineMessageConfigWithResponse } from 'extension/common/message/message-config';
import { MessageType } from 'extension/common/message/message-type.enum';
import {
  TemplateShortcutInfoChangedMessageInputSchema,
  TemplateShortcutInfoMessageInputSchema,
  TemplateShortcutInfoMessageOutputSchema,
} from 'extension/template/message/template-shortcut-info-message.schema';

/**
 * Lets a content script read the shortcut configuration it needs without touching storage itself.
 *
 * Templates live in local storage, which is restricted to trusted contexts (see
 * `ExtensionManager.restrictLocalStorageAccess`) because that area also holds URL shortener credentials. A content
 * script therefore cannot read them directly and must ask the service worker instead.
 */
export const TemplateShortcutInfoMessageConfig = defineMessageConfigWithResponse(MessageType.TemplateShortcutInfo, {
  input: TemplateShortcutInfoMessageInputSchema,
  output: TemplateShortcutInfoMessageOutputSchema,
});

/**
 * Broadcast to every tab when the shortcut configuration changes, so injected content scripts refresh their cache.
 *
 * It carries no payload: a content script cannot observe `storage.onChanged` for an area it has no access to, so this
 * exists purely to invalidate, and the tab then re-requests via {@link TemplateShortcutInfoMessageConfig}. Sending the
 * data instead would mean maintaining a second copy of the same contract for no benefit.
 */
export const TemplateShortcutInfoChangedMessageConfig = defineMessageConfig(MessageType.TemplateShortcutInfoChanged, {
  input: TemplateShortcutInfoChangedMessageInputSchema,
});
