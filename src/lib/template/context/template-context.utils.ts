import { decodeBase64 } from 'extension/common/codec/base64.utils';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { ExtensionInfo } from 'extension/common/extension-info';
import { Tab, TabContext } from 'extension/tab/tab.model';
import { TemplateContextData } from 'extension/template/context/template-context-data.model';
import { TemplateContextManager } from 'extension/template/context/template-context-manager';
import { TemplateContextOptions } from 'extension/template/context/template-context-options.model';
import {
  TemplateContextEntryDefinition,
  TemplateContextEntryDefinitionAlias,
  TemplateContextEntryRenderer,
  TemplateContextEntryValue,
} from 'extension/template/context/template-context.model';

export function buildOptions(data: TemplateContextData): TemplateContextOptions {
  const oauthData = data[DataNamespace.OAuth];
  const templateData = data[DataNamespace.Template];
  const urlShortenerData = data[DataNamespace.UrlShortener];

  return {
    templates: {
      action: {
        mode: templateData.action.mode,
        popup: {
          autocloseenabled: templateData.action.popup.autoCloseEnabled,
          optionlinkenabled: templateData.action.popup.optionLinkEnabled,
        },
        templateid: templateData.action.templateId,
      },
      contextmenu: {
        autopasteenabled: templateData.contextMenu.autoPasteEnabled,
        enabled: templateData.contextMenu.enabled,
        optionlinkenabled: templateData.contextMenu.optionLinkEnabled,
      },
      links: {
        target: templateData.link.target,
        title: templateData.link.title,
      },
      markdown: {
        inline: templateData.markdown.inline,
      },
      shortcuts: {
        autopasteenabled: templateData.shortcuts.autoPasteEnabled,
        enabled: templateData.shortcuts.enabled,
      },
    },
    urlshorteners: {
      bitly: {
        auth: {
          authenticated: oauthData.providers.bitly.accessToken != null,
          principal: oauthData.providers.bitly.principal,
        },
        enabled: urlShortenerData.providers.bitly.enabled,
      },
      yourls: {
        auth: {
          mode: urlShortenerData.providers.yourls.authenticationMode,
          password: decodeBase64(urlShortenerData.providers.yourls.password),
          signature: decodeBase64(urlShortenerData.providers.yourls.signature),
          username: decodeBase64(urlShortenerData.providers.yourls.username),
        },
        enabled: urlShortenerData.providers.yourls.enabled,
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
