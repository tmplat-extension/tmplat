import { AppearanceMode } from 'extension/common/appearance/appearance-mode.enum';
import { DEFAULT_TEMPLATE_DATA_GRID_APPEARANCE } from 'extension/common/appearance/data/appearance-data.schema';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { type Settings } from 'extension/common/settings/settings.model';
import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { OAuthProviderName } from 'extension/oauth/provider/oauth-provider-name.enum';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { type Template } from 'extension/template/template.model';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

export const createSettings = (overrides: Partial<Settings> = {}): Settings => ({
  analytics: { enabled: false },
  appearance: { mode: AppearanceMode.System, templateDataGrid: DEFAULT_TEMPLATE_DATA_GRID_APPEARANCE },
  general: {
    action: {
      mode: TemplateActionMode.Popup,
      popup: { autoCloseEnabled: true, optionLinkEnabled: true },
      templateId: null,
    },
    contextMenu: {
      autoPasteEnabled: false,
      enabled: true,
      mode: TemplateContextMenuMode.Menu,
      optionLinkEnabled: true,
    },
    link: { target: false, title: true },
    markdown: { inline: false },
    shortcuts: { autoPasteEnabled: false, enabled: true },
  },
  logging: { enabled: false, level: LogLevel.Info },
  notification: { changelog: { enabled: true, scope: VersionSegment.Minor }, enabled: true },
  oauth: { providers: { [OAuthProviderName.Bitly]: { accessToken: null, principal: null } } },
  urlShortener: {
    provider: UrlShortenerProviderName.DaGd,
    providers: {
      [UrlShortenerProviderName.Bitly]: {},
      [UrlShortenerProviderName.DaGd]: {},
      [UrlShortenerProviderName.SpooMe]: {},
      [UrlShortenerProviderName.Yourls]: {
        authenticationMode: YourlsAuthenticationMode.Basic,
        password: null,
        signature: null,
        url: null,
        username: null,
      },
    },
  },
  ...overrides,
});

export const createUserTemplate = (overrides: Partial<Extract<Template, { predefined: false }>> = {}): Template => ({
  content: 'Hello {title}',
  description: 'Copies the page title',
  enabled: true,
  id: 'template-1',
  predefined: false,
  shortcut: 'T',
  title: 'Title template',
  ...overrides,
});

export const createPredefinedTemplate = (
  overrides: Partial<Extract<Template, { predefined: true }>> = {},
): Template => ({
  content: '[{title}]({url})',
  descriptionKey: 'predefined_template_markdown_description',
  enabled: true,
  id: 'predefined-markdown',
  predefined: true,
  shortcut: null,
  titleKey: 'predefined_template_markdown_title',
  ...overrides,
});
