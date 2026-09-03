import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

// TODO: Complete
export type TemplateContextOptions = {
  readonly notifications: TemplateContextOptionsNotifications;
  readonly templates: TemplateContextOptionsTemplates;
  readonly urlShorteners: TemplateContextOptionsUrlShorteners;
};

export type TemplateContextOptionsNotifications = {
  readonly enabled: boolean;
};

export type TemplateContextOptionsUrlShorteners = {
  readonly bitly: TemplateContextOptionsUrlShortenersBitly;
  readonly dagd: TemplateContextOptionsUrlShortenersDagd;
  /** The single provider currently used to shorten URLs. */
  readonly provider: UrlShortenerProviderName;
  readonly spoome: TemplateContextOptionsUrlShortenersSpoome;
  readonly yourls: TemplateContextOptionsUrlShortenersYourls;
};

export type TemplateContextOptionsUrlShortenersBitly = {
  readonly auth: TemplateContextOptionsUrlShortenersBitlyAuth;
};

export type TemplateContextOptionsUrlShortenersBitlyAuth = {
  readonly authenticated: boolean;
  readonly principal: string | null;
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
  readonly templateId: string;
};

export type TemplateContextOptionsTemplatesActionPopup = {
  readonly autoCloseEnabled: boolean;
  readonly optionLinkEnabled: boolean;
};

export type TemplateContextOptionsTemplatesContextMenu = {
  // TODO: Is this used?
  readonly autoPasteEnabled: boolean;
  readonly enabled: boolean;
  readonly mode: TemplateContextMenuMode;
  readonly optionLinkEnabled: boolean;
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
