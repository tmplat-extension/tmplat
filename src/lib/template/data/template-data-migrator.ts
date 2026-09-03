import { isBoolean, isPlainObject, isString } from 'es-toolkit';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { type DataMigrationStep } from 'extension/common/data/migration/data-migration.model';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import { hasOwnKeys } from 'extension/common/object.utils';
import { type ValidationService, ValidationServiceToken } from 'extension/common/validation/validation.service';
import {
  type TemplateDataRepository,
  TemplateDataRepositoryToken,
} from 'extension/template/data/template-data.repository';
import {
  type TemplateData,
  type TemplateDataTemplate,
  TemplateDataTemplateSchema,
} from 'extension/template/data/template-data.schema';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';

@injectable()
export class TemplateDataMigrator extends AbstractDataMigrator {
  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(TemplateDataRepositoryToken) private readonly repository: TemplateDataRepository,
    @inject(ValidationServiceToken) private readonly validationService: ValidationService,
  ) {
    super({
      intl,
      logger: logging.getLogger('TemplateDataMigrator'),
      namespace: DataNamespace.Template,
    });
  }

  protected getSteps(builder: DataMigrationStepBuilder): DataMigrationStep[] {
    return [
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_template_migration_step_1',
        'links',
        this.repository,
        (data, legacyData) => {
          if (isPlainObject(legacyData)) {
            if (isBoolean(legacyData.target)) {
              data.link.target = legacyData.target;
            }
            if (isBoolean(legacyData.title)) {
              data.link.title = legacyData.title;
            }
          }
        },
      ),
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_template_migration_step_2',
        'markdown',
        this.repository,
        (data, legacyData) => {
          if (isPlainObject(legacyData) && isBoolean(legacyData.inline)) {
            data.markdown.inline = legacyData.inline;
          }
        },
      ),
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_template_migration_step_3',
        'menu',
        this.repository,
        (data, legacyData) => {
          if (isPlainObject(legacyData)) {
            if (isBoolean(legacyData.enabled)) {
              data.contextMenu.enabled = legacyData.enabled;
            }
            if (isBoolean(legacyData.options)) {
              data.contextMenu.optionLinkEnabled = legacyData.options;
            }
            if (isBoolean(legacyData.paste)) {
              data.contextMenu.autoPasteEnabled = legacyData.paste;
            }
          }
        },
      ),
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_template_migration_step_4',
        'shortcuts',
        this.repository,
        (data, legacyData) => {
          if (isPlainObject(legacyData)) {
            if (isBoolean(legacyData.enabled)) {
              data.shortcuts.enabled = legacyData.enabled;
            }
            if (isBoolean(legacyData.paste)) {
              data.shortcuts.autoPasteEnabled = legacyData.paste;
            }
          }
        },
      ),
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_template_migration_step_5',
        'templates',
        this.repository,
        (data, legacyData) => {
          if (Array.isArray(legacyData)) {
            this.migrateTemplatesFromV1(data, legacyData);
          }
        },
      ),
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_template_migration_step_6',
        'toolbar',
        this.repository,
        (data, legacyData) => {
          if (isPlainObject(legacyData)) {
            if (isBoolean(legacyData.close)) {
              data.action.popup.autoCloseEnabled = legacyData.close;
            }
            if (isBoolean(legacyData.options)) {
              data.action.popup.optionLinkEnabled = legacyData.options;
            }
            if (isBoolean(legacyData.popup)) {
              data.action.mode = legacyData.popup ? TemplateActionMode.Popup : TemplateActionMode.Template;
            }
            if (isString(legacyData.key) && legacyData.key) {
              const exists = data.templates.some((template) => template.id === legacyData.key);
              if (exists) {
                data.action.templateId = legacyData.key;
              }
            }
          }
        },
      ),
    ];
  }

  private migrateTemplatesFromV1(data: TemplateData, legacyTemplates: unknown[]) {
    const existingTemplates = data.templates.reduce((map, template) => {
      map.set(template.id, template);
      return map;
    }, new Map<string, TemplateDataTemplate>());

    for (const legacyTemplate of legacyTemplates) {
      if (!isPlainObject(legacyTemplate)) {
        continue;
      }

      const migratedTemplate: MigratedTemplateData = {};
      if (isString(legacyTemplate.content)) {
        migratedTemplate.content = legacyTemplate.content;
      }
      if (isBoolean(legacyTemplate.enabled)) {
        migratedTemplate.enabled = legacyTemplate.enabled;
      }
      if (isString(legacyTemplate.key)) {
        migratedTemplate.id = legacyTemplate.key;
      }
      if (isBoolean(legacyTemplate.predefined)) {
        migratedTemplate.predefined = legacyTemplate.predefined;
      }
      migratedTemplate.shortcut =
        isString(legacyTemplate.shortcut) && legacyTemplate.shortcut ? legacyTemplate.shortcut : null;
      if (isString(legacyTemplate.title) && legacyTemplate.title) {
        migratedTemplate.title = legacyTemplate.title;
      }

      // TODO: Add more logging explaining why templates are skipped
      if (migratedTemplate.predefined) {
        if (hasOwnKeys(migratedTemplate, ['enabled', 'id', 'shortcut'])) {
          const existingTemplate = existingTemplates.get(migratedTemplate.id);
          if (existingTemplate && existingTemplate.predefined) {
            Object.assign(existingTemplate, {
              enabled: migratedTemplate.enabled,
              shortcut: migratedTemplate.shortcut,
            });
          } else {
            // TODO: LOG
            this.logger.warn('');
          }
        } else {
          // TODO: LOG
        }
      } else if (
        this.validationService.isValidSchema(migratedTemplate, TemplateDataTemplateSchema) &&
        !existingTemplates.has(migratedTemplate.id)
      ) {
        data.templates.push(migratedTemplate);
      } else {
        // TODO: LOG
      }
    }

    // TODO: Sort templates based on legacyTemplates ordering somehow? Legacy templates have "index" property. Best effort?
  }
}

type MigratedTemplateData = {
  content?: string;
  enabled?: boolean;
  id?: string;
  predefined?: boolean;
  shortcut?: string | null;
  title?: string;
};
