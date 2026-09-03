import { type VersionSegment } from 'extension/common/version/version-segment.enum';
import { type TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { type TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { type UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { type YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

/**
 * The user's settings, as exposed to a template through the `options` collection entry.
 *
 * The logging and migration namespaces are deliberately absent: they are diagnostics rather than options a template
 * could meaningfully render.
 */
export type TemplateContextOptions = {
  readonly notifications: TemplateContextOptionsNotifications;
  readonly templates: TemplateContextOptionsTemplates;
  readonly urlShorteners: TemplateContextOptionsUrlShorteners;
};

export type TemplateContextOptionsNotifications = {
  readonly changelog: TemplateContextOptionsNotificationsChangelog;
  readonly enabled: boolean;
};

export type TemplateContextOptionsNotificationsChangelog = {
  readonly enabled: boolean;
  readonly scope: VersionSegment;
};

export type TemplateContextOptionsUrlShorteners = {
  readonly dagd: TemplateContextOptionsUrlShortenersDagd;
  /** The single provider currently used to shorten URLs. */
  readonly provider: UrlShortenerProviderName;
  readonly spoome: TemplateContextOptionsUrlShortenersSpoome;
  readonly yourls: TemplateContextOptionsUrlShortenersYourls;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TemplateContextOptionsUrlShortenersDagd = {};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TemplateContextOptionsUrlShortenersSpoome = {};

export type TemplateContextOptionsUrlShortenersYourls = {
  readonly auth: TemplateContextOptionsUrlShortenersYourlsAuth;
  readonly url: string | null;
};

export type TemplateContextOptionsUrlShortenersYourlsAuth = {
  readonly mode: YourlsAuthenticationMode | null;
  readonly password: string | null;
  readonly signature: string | null;
  readonly username: string | null;
};

export type TemplateContextOptionsTemplates = {
  readonly action: TemplateContextOptionsTemplatesAction;
  readonly contextMenu: TemplateContextOptionsTemplatesContextMenu;
  readonly links: TemplateContextOptionsTemplatesLinks;
  readonly markdown: TemplateContextOptionsTemplatesMarkdown;
  readonly shortcuts: TemplateContextOptionsTemplatesShortcuts;
};

export type TemplateContextOptionsTemplatesAction = {
  readonly mode: TemplateActionMode;
  readonly popup: TemplateContextOptionsTemplatesActionPopup;
  readonly templateId: string | null;
};

export type TemplateContextOptionsTemplatesActionPopup = {
  readonly autoCloseEnabled: boolean;
  readonly optionLinkEnabled: boolean;
};

export type TemplateContextOptionsTemplatesContextMenu = {
  readonly autoPasteEnabled: boolean;
  readonly enabled: boolean;
  readonly mode: TemplateContextMenuMode;
  readonly optionLinkEnabled: boolean;
  readonly templateId: string | null;
};

export type TemplateContextOptionsTemplatesLinks = {
  readonly target: boolean;
  readonly title: boolean;
};

export type TemplateContextOptionsTemplatesMarkdown = {
  inline: boolean;
};

export type TemplateContextOptionsTemplatesShortcuts = {
  autoPasteEnabled: boolean;
  enabled: boolean;
};
