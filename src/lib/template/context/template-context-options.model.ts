import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

// TODO: Complete
export type TemplateContextOptions = {
  readonly templates: TemplateContextOptionsTemplates;
  readonly urlshorteners: TemplateContextOptionsUrlShorteners;
};

export type TemplateContextOptionsUrlShorteners = {
  readonly bitly: TemplateContextOptionsUrlShortenersBitly;
  readonly yourls: TemplateContextOptionsUrlShortenersYourls;
};

export type TemplateContextOptionsUrlShortenersBitly = {
  readonly auth: TemplateContextOptionsUrlShortenersBitlyAuth;
  readonly enabled: boolean;
};

export type TemplateContextOptionsUrlShortenersBitlyAuth = {
  readonly authenticated: boolean;
  readonly principal: string | null;
};

export type TemplateContextOptionsUrlShortenersYourls = {
  readonly auth: TemplateContextOptionsUrlShortenersYourlsAuth;
  readonly enabled: boolean;
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
  readonly contextmenu: TemplateContextOptionsTemplatesContextMenu;
  readonly links: TemplateContextOptionsTemplatesLinks;
  readonly markdown: TemplateContextOptionsTemplatesMarkdown;
  readonly shortcuts: TemplateContextOptionsTemplatesShortcuts;
};

export type TemplateContextOptionsTemplatesAction = {
  readonly mode: TemplateActionMode;
  readonly popup: TemplateContextOptionsTemplatesActionPopup;
  readonly templateid: string;
};

export type TemplateContextOptionsTemplatesActionPopup = {
  readonly autocloseenabled: boolean;
  readonly optionlinkenabled: boolean;
};

export type TemplateContextOptionsTemplatesContextMenu = {
  // TODO: Is this used?
  readonly autopasteenabled: boolean;
  readonly enabled: boolean;
  readonly optionlinkenabled: boolean;
};

export type TemplateContextOptionsTemplatesLinks = {
  readonly target: boolean;
  readonly title: boolean;
};

export type TemplateContextOptionsTemplatesMarkdown = {
  inline: boolean;
};

export type TemplateContextOptionsTemplatesShortcuts = {
  autopasteenabled: boolean;
  enabled: boolean;
};
