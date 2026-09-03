import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { ExtensionInfo } from 'extension/common/extension-info';
import { Tab, TabContext } from 'extension/tab/tab.model';
import { TemplateContextData } from 'extension/template/context/template-context-data.model';
import { TemplateContextManager } from 'extension/template/context/template-context-manager';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextOptions } from 'extension/template/context/template-context-options.model';
import { TemplateContextTemplate } from 'extension/template/context/template-context-template.model';
import {
  TemplateContextEntryDefinition,
  TemplateContextEntryDefinitionAlias,
  TemplateContextEntryRenderer,
  TemplateContextEntryValue,
  TemplateContextKey,
} from 'extension/template/context/template-context.model';
import { Template } from 'extension/template/template.model';
import { TemplateService } from 'extension/template/template.service';

/**
 * Converts an entry name into the key under which it is registered within the template context.
 *
 * Entry names are declared in camel case so that they read well (e.g. within the guide), however, they are always
 * registered in lower case so that lookups from within a template are case-insensitive.
 */
export function toTemplateContextKey(name: TemplateContextName): TemplateContextKey {
  return name.toLowerCase() as TemplateContextKey;
}

/**
 * Normalizes `template` so that predefined and user-defined templates share a single shape.
 *
 * A predefined template's `titleKey`/`descriptionKey` are resolved into the localized `title`/`description` instead of
 * being exposed as message keys, which are meaningless within a template.
 */
export function buildTemplate(template: Template, templateService: TemplateService): TemplateContextTemplate {
  return {
    content: template.content,
    description: templateService.getTemplateDescription(template),
    enabled: template.enabled,
    id: template.id,
    predefined: template.predefined,
    shortcut: template.shortcut,
    title: templateService.getTemplateTitle(template),
  };
}

export function buildOptions(data: TemplateContextData): TemplateContextOptions {
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
}

export function createContentRenderer(
  mapper: (
    content: string,
    manager: TemplateContextManager,
  ) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>,
): TemplateContextEntryRenderer {
  return (manager) => {
    return () => {
      return async (text, render) => mapper(await manager.render(text, render), manager);
    };
  };
}

export function createDataRenderer(
  mapper: (
    data: TemplateContextData,
    manager: TemplateContextManager,
  ) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>,
): TemplateContextEntryRenderer {
  return (manager) => {
    return async () => mapper(await manager.getData(), manager);
  };
}

export function createDataNamespaceRenderer<N extends keyof TemplateContextData>(
  namespace: N,
  mapper: (
    data: TemplateContextData[N],
    manager: TemplateContextManager,
  ) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>,
): TemplateContextEntryRenderer {
  return (manager) => {
    return async () => mapper(await manager.getDataNamespace(namespace), manager);
  };
}

export function createExtensionInfoRenderer(
  mapper: (
    extensionInfo: ExtensionInfo,
    manager: TemplateContextManager,
  ) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>,
): TemplateContextEntryRenderer {
  return (manager) => {
    return async () => mapper(manager.getExtensionInfo(), manager);
  };
}

export function createNumericContentRenderer(
  mapper: (
    value: number,
    manager: TemplateContextManager,
  ) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>,
): TemplateContextEntryRenderer {
  return createTrimmedContentRenderer((content, manager) => mapper(parseInt(content, 10), manager));
}

export function createNumericTabContextRenderer(
  mapper: (value: number, tabContext: TabContext, manager: TemplateContextManager) => TemplateContextEntryValue,
): TemplateContextEntryRenderer {
  return createNumericContentRenderer(async (value, manager) => mapper(value, await manager.getTabContext(), manager));
}

export function createOptionRenderer(
  mapper: (options: TemplateContextOptions, manager: TemplateContextManager) => TemplateContextEntryValue,
): TemplateContextEntryRenderer {
  return (manager) => {
    return async () => mapper(await manager.getOptions(), manager);
  };
}

export function createTabContextRenderer(
  mapper: (tabContext: TabContext, manager: TemplateContextManager) => TemplateContextEntryValue,
): TemplateContextEntryRenderer {
  return (manager) => {
    return async () => mapper(await manager.getTabContext(), manager);
  };
}

export function createTabRenderer(
  mapper: (tab: Tab, manager: TemplateContextManager) => TemplateContextEntryValue,
): TemplateContextEntryRenderer {
  return (manager) => {
    return async () => mapper(manager.getTab(), manager);
  };
}

export function createTemplateRenderer(
  mapper: (template: TemplateContextTemplate, manager: TemplateContextManager) => TemplateContextEntryValue,
): TemplateContextEntryRenderer {
  return (manager) => {
    return () => mapper(manager.getTemplate(), manager);
  };
}

export function createTrimmedContentRenderer(
  mapper: (
    content: string,
    manager: TemplateContextManager,
  ) => TemplateContextEntryValue | Promise<TemplateContextEntryValue>,
): TemplateContextEntryRenderer {
  return (manager) => {
    return () => {
      return async (text, render) => mapper(await manager.renderTrim(text, render), manager);
    };
  };
}

export function defineWithAliases(
  definition: TemplateContextEntryDefinition,
  aliases: TemplateContextEntryDefinitionAlias[],
): TemplateContextEntryDefinition[] {
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
}
