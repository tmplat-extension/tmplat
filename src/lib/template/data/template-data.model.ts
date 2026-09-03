import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';

export type TemplateData = {
  action: TemplateDataAction;
  contextMenu: TemplateDataContextMenu;
  link: TemplateDataLink;
  markdown: TemplateDataMarkdown;
  shortcuts: TemplateDataShortcuts;
  templates: TemplateDataTemplate[];
};

export type TemplateDataAction = {
  mode: TemplateActionMode;
  popup: TemplateDataActionPopup;
  templateId: string;
};

export type TemplateDataActionPopup = {
  autoCloseEnabled: boolean;
  optionLinkEnabled: boolean;
};

export type TemplateDataContextMenu = {
  // TODO: Is this used?
  autoPasteEnabled: boolean;
  enabled: boolean;
  mode: TemplateContextMenuMode;
  optionLinkEnabled: boolean;
};

export type TemplateDataLink = {
  target: boolean;
  title: boolean;
};

export type TemplateDataMarkdown = {
  inline: boolean;
};

export type TemplateDataShortcuts = {
  autoPasteEnabled: boolean;
  enabled: boolean;
};

export type TemplateDataTemplate = TemplateDataTemplatePredefined | TemplateDataTemplateUserDefined;

export type TemplateDataTemplateBase = {
  enabled: boolean;
  readonly id: string;
  shortcut: string | null;
};

/**
 * Only the properties of a predefined template that a user can change are persisted - everything else is resolved from
 * the predefined template dictionary using `id`, so that predefined templates can be changed between releases without
 * needing to migrate stored data.
 */
export type TemplateDataTemplatePredefined = TemplateDataTemplateBase & {
  readonly predefined: true;
};

export type TemplateDataTemplateUserDefined = TemplateDataTemplateBase & {
  content: string;
  description: string | null;
  readonly predefined: false;
  title: string;
};
