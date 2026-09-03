/* oxlint-disable react/jsx-no-constructed-context-values -- The provider values are deliberately rebuilt per
   render: each test supplies its own stubs and there is no re-render cost worth optimising in a test helper. */
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { AppearanceContext } from 'extension/common/appearance/appearance.context';
import { type AppearanceService } from 'extension/common/appearance/appearance.service';
import { type IntlMessageKey } from 'extension/common/intl/intl-message-key';
import { IntlContext } from 'extension/common/intl/intl.context';
import { type IntlService } from 'extension/common/intl/intl.service';
import { LoggingContext } from 'extension/common/logging/logging.context';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { type MessageService } from 'extension/common/message/message.service';
import { MessagesContext } from 'extension/common/message/messages.context';
import { SettingsContext } from 'extension/common/settings/settings.context';
import { type SettingsService } from 'extension/common/settings/settings.service';
import { OAuthContext } from 'extension/oauth/oauth.context';
import { type OAuthService } from 'extension/oauth/oauth.service';
import { type TabService } from 'extension/tab/tab.service';
import { TabsContext } from 'extension/tab/tabs.context';
import { type TemplateService } from 'extension/template/template.service';
import { TemplatesContext } from 'extension/template/templates.context';
import { createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { createOAuthServiceMock } from 'extension/test/oauth.mock';
import { ErrorMessageContext } from 'extension/ui/common/hooks/use-error-message';

/**
 * The collaborators that {@link renderUi} injects. Every one is optional; anything omitted falls back to a stub, so a
 * test only has to supply what it actually exercises.
 *
 * Partial stubs are accepted because these service interfaces are wide and a component typically touches one or two
 * members of each.
 */
export type RenderUiContexts = {
  appearanceService?: Partial<AppearanceService>;
  errorMessageKey?: IntlMessageKey;
  intl?: Partial<IntlService>;
  logging?: Partial<LoggingService>;
  messageService?: Partial<MessageService>;
  oauthService?: Partial<OAuthService>;
  settingsService?: Partial<SettingsService>;
  tabService?: Partial<TabService>;
  templateService?: Partial<TemplateService>;
};

export type RenderUiOptions = Omit<RenderOptions, 'wrapper'> & { contexts?: RenderUiContexts };

/**
 * Renders `ui` inside the same context providers that the real entry points install (see e.g. `options-ui.tsx`), so
 * that components relying on `useIntl`, `useSettings` and friends work without each test rebuilding the provider
 * tree.
 *
 * The default `intl` echoes the message key, which keeps assertions readable and independent of `_locales` copy.
 */
export const renderUi = (ui: ReactElement, { contexts, ...options }: RenderUiOptions = {}): RenderResult => {
  const {
    appearanceService = {},
    errorMessageKey = 'error_snackbar_unknown_message',
    intl = createIntlServiceMock(),
    logging = createLoggingServiceMock(),
    messageService = {},
    oauthService = createOAuthServiceMock(),
    settingsService = {},
    tabService = {},
    templateService = {},
  } = contexts ?? {};

  const wrapper = ({ children }: { children: ReactNode }) => (
    <LoggingContext.Provider value={logging as LoggingService}>
      <IntlContext.Provider value={intl as IntlService}>
        <TabsContext.Provider value={tabService as TabService}>
          <AppearanceContext.Provider value={appearanceService as AppearanceService}>
            <SettingsContext.Provider value={settingsService as SettingsService}>
              <OAuthContext.Provider value={oauthService as OAuthService}>
                <TemplatesContext.Provider value={templateService as TemplateService}>
                  <MessagesContext.Provider value={messageService as MessageService}>
                    <ErrorMessageContext.Provider value={errorMessageKey}>{children}</ErrorMessageContext.Provider>
                  </MessagesContext.Provider>
                </TemplatesContext.Provider>
              </OAuthContext.Provider>
            </SettingsContext.Provider>
          </AppearanceContext.Provider>
        </TabsContext.Provider>
      </IntlContext.Provider>
    </LoggingContext.Provider>
  );

  return render(ui, { ...options, wrapper });
};
