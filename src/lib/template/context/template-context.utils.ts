import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type ExtensionInfo } from 'extension/common/extension-info';
import { type TabContext } from 'extension/tab/tab-context.schema';
import { type Tab } from 'extension/tab/tab.model';
import { type TemplateContextData } from 'extension/template/context/template-context-data.model';
import { type TemplateContextManager } from 'extension/template/context/template-context-manager';
import { type TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { type TemplateContextOptions } from 'extension/template/context/template-context-options.model';
import { type TemplateContextTemplate } from 'extension/template/context/template-context-template.model';
import {
  type TemplateContextEntryDefinition,
  type TemplateContextEntryDefinitionAlias,
  type TemplateContextEntryRenderer,
  type TemplateContextEntryValue,
  type TemplateContextKey,
} from 'extension/template/context/template-context.model';
import { type Template } from 'extension/template/template.model';
import { type TemplateService } from 'extension/template/template.service';

/**
 * Converts an entry name into the key under which it is registered within the template context.
 *
 * Entry names are declared in camel case so that they read well (e.g. within the guide), however, they are always
 * registered in lower case so that lookups from within a template are case-insensitive.
 */
export const toTemplateContextKey = (name: TemplateContextName): TemplateContextKey =>
  name.toLowerCase() as TemplateContextKey;

/**
 * Normalizes `template` so that predefined and user-defined templates share a single shape.
 *
 * A predefined template's `titleKey`/`descriptionKey` are resolved into the localized `title`/`description` instead of
 * being exposed as message keys, which are meaningless within a template.
 */
export const buildTemplate = (template: Template, templateService: TemplateService): TemplateContextTemplate => ({
  content: template.content,
  description: templateService.getTemplateDescription(template),
  enabled: template.enabled,
  id: template.id,
  predefined: template.predefined,
  shortcut: template.shortcut,
  title: templateService.getTemplateTitle(template),
});

export const buildOptions = (data: TemplateContextData): TemplateContextOptions => {
  const notificationData = data[DataNamespace.Notification];
  const oauthData = data[DataNamespace.OAuth];
  const templateData = data[DataNamespace.Template];
  const urlShortenerData = data[DataNamespace.UrlShortener];

  return {
    notifications: {
      enabled: notificationData.enabled,
    },
    templates: {
      action: {
        mode: templateData.action.mode,
        popup: {
          autoCloseEnabled: templateData.action.popup.autoCloseEnabled,
          optionLinkEnabled: templateData.action.popup.optionLinkEnabled,
        },
        templateId: templateData.action.templateId,
      },
      contextMenu: {
        autoPasteEnabled: templateData.contextMenu.autoPasteEnabled,
        enabled: templateData.contextMenu.enabled,
        mode: templateData.contextMenu.mode,
        optionLinkEnabled: templateData.contextMenu.optionLinkEnabled,
      },
      links: {
        target: templateData.link.target,
        title: templateData.link.title,
      },
      markdown: {
        inline: templateData.markdown.inline,
      },
      shortcuts: {
        autoPasteEnabled: templateData.shortcuts.autoPasteEnabled,
        enabled: templateData.shortcuts.enabled,
      },
    },
    urlShorteners: {
      bitly: {
        auth: {
          authenticated: oauthData.providers.bitly.accessToken != null,
          principal: oauthData.providers.bitly.principal,
        },
      },
      dagd: {},
      provider: urlShortenerData.provider,
      spoome: {},
      yourls: {
        auth: {
          mode: urlShortenerData.providers.yourls.authenticationMode,
          password: urlShortenerData.providers.yourls.password,
          signature: urlShortenerData.providers.yourls.signature,
          username: urlShortenerData.providers.yourls.username,
        },
        url: urlShortenerData.providers.yourls.url,
      },
    },
  };
};

export const createContentRenderer =
  (
    mapper: (
      content: string,
      manager: TemplateContextManager,
    ) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>,
  ): TemplateContextEntryRenderer =>
  (manager) =>
  () =>
  async (text, render) =>
    mapper(await manager.render(text, render), manager);

export const createDataRenderer =
  (
    mapper: (
      data: TemplateContextData,
      manager: TemplateContextManager,
    ) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>,
  ): TemplateContextEntryRenderer =>
  (manager) =>
  async () =>
    mapper(await manager.getData(), manager);

export const createDataNamespaceRenderer =
  <N extends keyof TemplateContextData>(
    namespace: N,
    mapper: (
      data: TemplateContextData[N],
      manager: TemplateContextManager,
    ) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>,
  ): TemplateContextEntryRenderer =>
  (manager) =>
  async () =>
    mapper(await manager.getDataNamespace(namespace), manager);

export const createExtensionInfoRenderer =
  (
    mapper: (
      extensionInfo: ExtensionInfo,
      manager: TemplateContextManager,
    ) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>,
  ): TemplateContextEntryRenderer =>
  (manager) =>
  async () =>
    mapper(manager.getExtensionInfo(), manager);

export const createNumericContentRenderer = (
  mapper: (
    value: number,
    manager: TemplateContextManager,
  ) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>,
): TemplateContextEntryRenderer =>
  createTrimmedContentRenderer((content, manager) => mapper(parseInt(content, 10), manager));

export const createNumericTabContextRenderer = (
  mapper: (value: number, tabContext: TabContext, manager: TemplateContextManager) => TemplateContextEntryValue,
): TemplateContextEntryRenderer =>
  createNumericContentRenderer(async (value, manager) => mapper(value, await manager.getTabContext(), manager));

export const createOptionRenderer =
  (
    mapper: (options: TemplateContextOptions, manager: TemplateContextManager) => TemplateContextEntryValue,
  ): TemplateContextEntryRenderer =>
  (manager) =>
  async () =>
    mapper(await manager.getOptions(), manager);

export const createTabContextRenderer =
  (
    mapper: (tabContext: TabContext, manager: TemplateContextManager) => TemplateContextEntryValue,
  ): TemplateContextEntryRenderer =>
  (manager) =>
  async () =>
    mapper(await manager.getTabContext(), manager);

export const createTabRenderer =
  (mapper: (tab: Tab, manager: TemplateContextManager) => TemplateContextEntryValue): TemplateContextEntryRenderer =>
  (manager) =>
  async () =>
    mapper(manager.getTab(), manager);

export const createTemplateRenderer =
  (
    mapper: (template: TemplateContextTemplate, manager: TemplateContextManager) => TemplateContextEntryValue,
  ): TemplateContextEntryRenderer =>
  (manager) =>
  () =>
    mapper(manager.getTemplate(), manager);

export const createTrimmedContentRenderer =
  (
    mapper: (
      content: string,
      manager: TemplateContextManager,
    ) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>,
  ): TemplateContextEntryRenderer =>
  (manager) =>
  () =>
  async (text, render) =>
    mapper(await manager.renderTrim(text, render), manager);

export const defineWithAliases = (
  definition: TemplateContextEntryDefinition,
  aliases: TemplateContextEntryDefinitionAlias[],
): TemplateContextEntryDefinition[] => {
  const aliasedDefinition: TemplateContextEntryDefinition = {
    aliases: aliases.map((alias) => alias.name),
    ...definition,
  };

  return [aliasedDefinition].concat(
    aliases.map((alias) => {
      if (definition.name !== alias.aliasOf) {
        throw new Error(
          `Template context entry definition for '${definition.name}' does not match alias: '${alias.aliasOf}'`,
        );
      }

      return {
        ...alias,
        categories: definition.categories,
        features: definition.features,
        render: definition.render,
      };
    }),
  );
};
