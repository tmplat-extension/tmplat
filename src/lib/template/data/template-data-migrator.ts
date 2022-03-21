import { isBoolean, isPlainObject, isString, isUndefined } from 'lodash-es';

import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { DataMigrationContext } from 'extension/common/data/migration/data-migration.model';
import { DataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { getLegacyTemplateIconMap } from 'extension/template/data/legacy-template-icon-map';
import { TemplateData, TemplateDataTemplate } from 'extension/template/data/template-data.model';
import { TemplateDataRepository, TemplateDataRepositoryToken } from 'extension/template/data/template-data.repository';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateIconName } from 'extension/template/template-icon-name.model';
import { TemplateTitleMode } from 'extension/template/template-title-mode.enum';
import { Template } from 'extension/template/template.model';

@injectable()
export class TemplateDataMigrator implements DataMigrator {
  readonly namespace = DataNamespace.Template;

  constructor(@inject(TemplateDataRepositoryToken) private readonly repository: TemplateDataRepository) {}

  isRequired(oldVersion: ExtensionVersion): boolean {
    return oldVersion === ExtensionVersion.V1_2_9;
  }

  async migrate({ legacyDataService, oldVersion }: DataMigrationContext): Promise<void> {
    if (oldVersion === ExtensionVersion.V1_2_9) {
      const legacyLinksData = await legacyDataService.local.get('links');
      const legacyMarkdownData = await legacyDataService.local.get('markdown');
      const legacyMenuData = await legacyDataService.local.get('menu');
      const legacyShortcutsData = await legacyDataService.local.get('shortcuts');
      const legacyTemplatesData = await legacyDataService.local.get('templates');
      const legacyToolbarData = await legacyDataService.local.get('toolbar');

      await this.repository.modify((data) => {
        TemplateDataMigrator.migrateAction(data, legacyToolbarData);
        TemplateDataMigrator.migrateContextMenu(data, legacyMenuData);
        TemplateDataMigrator.migrateLink(data, legacyLinksData);
        TemplateDataMigrator.migrateMarkdown(data, legacyMarkdownData);
        TemplateDataMigrator.migrateShortcuts(data, legacyShortcutsData);
        this.migrateTemplates(data, legacyTemplatesData);

        return data;
      });

      await legacyDataService.local.removeAll(['links', 'markdown', 'menu', 'shortcuts', 'templates', 'toolbar']);
    }
  }

  private static isValidTemplate(
    migratedTemplateData: MigratedTemplateData,
  ): migratedTemplateData is TemplateDataTemplate {
    return Object.values(migratedTemplateData).every((value) => !isUndefined(value));
  }

  private static migrateAction(data: TemplateData, legacyToolbarData: any) {
    if (!isPlainObject(legacyToolbarData)) {
      return;
    }

    if (isBoolean(legacyToolbarData.close)) {
      data.action.popup.autoCloseEnabled = legacyToolbarData.close;
    }
    if (isBoolean(legacyToolbarData.options)) {
      data.action.popup.optionLinkEnabled = legacyToolbarData.options;
    }
    if (isBoolean(legacyToolbarData.popup)) {
      data.action.mode = legacyToolbarData.popup ? TemplateActionMode.Popup : TemplateActionMode.Template;
    }
    if (isString(legacyToolbarData.key) && legacyToolbarData.key) {
      data.action.templateId = legacyToolbarData.key;
    }
  }

  private static migrateContextMenu(data: TemplateData, legacyMenuData: any) {
    if (!isPlainObject(legacyMenuData)) {
      return;
    }

    if (isBoolean(legacyMenuData.enabled)) {
      data.contextMenu.enabled = legacyMenuData.enabled;
    }
    if (isBoolean(legacyMenuData.options)) {
      data.contextMenu.optionLinkEnabled = legacyMenuData.options;
    }
    if (isBoolean(legacyMenuData.paste)) {
      data.contextMenu.autoPasteEnabled = legacyMenuData.paste;
    }
  }

  private static migrateLink(data: TemplateData, legacyLinksData: any) {
    if (!isPlainObject(legacyLinksData)) {
      return;
    }

    if (isBoolean(legacyLinksData.target)) {
      data.link.target = legacyLinksData.target;
    }
    if (isBoolean(legacyLinksData.title)) {
      data.link.title = legacyLinksData.title;
    }
  }

  private static migrateMarkdown(data: TemplateData, legacyMarkdownData: any) {
    if (isPlainObject(legacyMarkdownData) && isBoolean(legacyMarkdownData.inline)) {
      data.markdown.inline = legacyMarkdownData.inline;
    }
  }

  private static migrateShortcuts(data: TemplateData, legacyShortcutsData: any) {
    if (!isPlainObject(legacyShortcutsData)) {
      return;
    }

    if (isBoolean(legacyShortcutsData.enabled)) {
      data.shortcuts.enabled = legacyShortcutsData.enabled;
    }
    if (isBoolean(legacyShortcutsData.paste)) {
      data.shortcuts.autoPasteEnabled = legacyShortcutsData.paste;
    }
  }

  private migrateTemplate(
    legacyTemplateData: any,
    legacyTemplateIconMap: Readonly<Record<string, TemplateIconName>>,
  ): Template | null {
    if (!isPlainObject(legacyTemplateData)) {
      return null;
    }

    const migratedTemplateData: MigratedTemplateData = {};

    if (isString(legacyTemplateData.content) && legacyTemplateData.content) {
      migratedTemplateData.content = legacyTemplateData.content;
    }
    if (isBoolean(legacyTemplateData.enabled)) {
      migratedTemplateData.enabled = legacyTemplateData.enabled;
    }
    migratedTemplateData.icon = isString(legacyTemplateData.image)
      ? legacyTemplateIconMap[legacyTemplateData.image] ?? null
      : null;
    if (isString(legacyTemplateData.key)) {
      migratedTemplateData.id = legacyTemplateData.key;
    }
    if (isBoolean(legacyTemplateData.readOnly)) {
      migratedTemplateData.predefined = legacyTemplateData.predefined;
    }
    if (isBoolean(legacyTemplateData.readOnly)) {
      migratedTemplateData.predefined = legacyTemplateData.predefined;
    }
    migratedTemplateData.shortcut =
      isString(legacyTemplateData.shortcut) && legacyTemplateData.shortcut ? legacyTemplateData.shortcut : null;
    if (isString(legacyTemplateData.title) && legacyTemplateData.title) {
      migratedTemplateData.title = migratedTemplateData.predefined
        ? {
            key: legacyTemplateData.title as IntlMessageKey,
            mode: TemplateTitleMode.Localized,
          }
        : {
            mode: TemplateTitleMode.Exact,
            value: legacyTemplateData.title,
          };
    }

    return TemplateDataMigrator.isValidTemplate(migratedTemplateData) ? migratedTemplateData : null;
  }

  private migrateTemplates(data: TemplateData, legacyTemplatesData: any) {
    if (!Array.isArray(legacyTemplatesData)) {
      return;
    }

    const legacyTemplateIconMap = getLegacyTemplateIconMap();

    legacyTemplatesData.forEach((legacyTemplateData) => {
      const template = this.migrateTemplate(legacyTemplateData, legacyTemplateIconMap);
      if (!template) {
        return;
      }

      if (template.predefined) {
        const predefinedTemplate = data.templates.find(
          (existingTemplate) => existingTemplate.predefined && existingTemplate.id === template.id,
        );
        if (predefinedTemplate) {
          Object.assign(predefinedTemplate, {
            enabled: template.enabled,
            icon: template.icon ?? predefinedTemplate.icon,
            shortcut: template.shortcut,
          });
        }
      } else {
        data.templates.push(template);
      }
    });

    // TODO: Sort templates based on legacyTemplatesData ordering somehow
  }
}

type MigratedTemplateData =
  | {
      content?: string;
      enabled?: boolean;
      icon?: TemplateIconName | null;
      id?: string;
      predefined?: true;
      shortcut?: string | null;
      title?: {
        key: IntlMessageKey;
        mode: TemplateTitleMode.Localized;
      };
    }
  | {
      content?: string;
      enabled?: boolean;
      icon?: TemplateIconName | null;
      id?: string;
      predefined?: false;
      shortcut?: string | null;
      title?: {
        mode: TemplateTitleMode.Exact;
        value: string;
      };
    };
