import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataMigrationStepBuilder } from 'extension/common/data/migration/data-migration-step-builder';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { type DataMigrationStep } from 'extension/common/data/migration/data-migration.model';
import { AbstractDataMigrator } from 'extension/common/data/migration/data-migrator';
import { inject, injectable } from 'extension/common/di';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { type LoggingService, LoggingServiceToken } from 'extension/common/logging/logging.service';
import {
  LegacyTemplateContextMenuDataSchema,
  type LegacyTemplateDefinition,
  LegacyTemplateDefinitionSchema,
  LegacyTemplateLinkDataSchema,
  LegacyTemplateMarkdownDataSchema,
  LegacyTemplatesDataSchema,
  LegacyTemplateShortcutDataSchema,
  LegacyTemplateToolbarDataSchema,
} from 'extension/template/data/legacy-template-data.schema';
import {
  type TemplateDataRepository,
  TemplateDataRepositoryToken,
} from 'extension/template/data/template-data.repository';
import {
  normalizeTemplateShortcut,
  type TemplatePredefined,
  type TemplateUserDefined,
} from 'extension/template/data/template-data.schema';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { type TemplateIdGenerator, TemplateIdGeneratorToken } from 'extension/template/template-id-generator';

@injectable()
export class TemplateDataMigrator extends AbstractDataMigrator {
  constructor(
    @inject(IntlServiceToken) intl: IntlService,
    @inject(LoggingServiceToken) logging: LoggingService,
    @inject(TemplateDataRepositoryToken) private readonly repository: TemplateDataRepository,
    @inject(TemplateIdGeneratorToken) private readonly idGenerator: TemplateIdGenerator,
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
        { key: 'links', schema: LegacyTemplateLinkDataSchema, storage: 'local' },
        this.repository,
        (data, legacyData) => {
          if (legacyData.target !== undefined) {
            data.link.target = legacyData.target;
          }
          if (legacyData.title !== undefined) {
            data.link.title = legacyData.title;
          }
        },
      ),
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_template_migration_step_2',
        { key: 'markdown', schema: LegacyTemplateMarkdownDataSchema, storage: 'local' },
        this.repository,
        (data, legacyData) => {
          if (legacyData.inline !== undefined) {
            data.markdown.inline = legacyData.inline;
          }
        },
      ),
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_template_migration_step_3',
        { key: 'menu', schema: LegacyTemplateContextMenuDataSchema, storage: 'local' },
        this.repository,
        (data, legacyData) => {
          if (legacyData.enabled !== undefined) {
            data.contextMenu.enabled = legacyData.enabled;
          }
          if (legacyData.options !== undefined) {
            data.contextMenu.optionLinkEnabled = legacyData.options;
          }
          if (legacyData.paste !== undefined) {
            data.contextMenu.autoPasteEnabled = legacyData.paste;
          }
        },
      ),
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_template_migration_step_4',
        { key: 'shortcuts', schema: LegacyTemplateShortcutDataSchema, storage: 'local' },
        this.repository,
        (data, legacyData) => {
          if (legacyData.enabled !== undefined) {
            data.shortcuts.enabled = legacyData.enabled;
          }
          if (legacyData.paste !== undefined) {
            data.shortcuts.autoPasteEnabled = legacyData.paste;
          }
        },
      ),
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_template_migration_step_5',
        { key: 'templates', schema: LegacyTemplatesDataSchema, storage: 'local' },
        this.repository,
        (data, legacyData, context) => {
          const errors: ExtensionError[] = [];
          const { ids, migratedIds, predefinedTemplates, seenShortcuts } = data.templates.reduce(
            (acc, t) => {
              acc.ids.add(t.id);
              if (t.predefined) {
                acc.predefinedTemplates.set(t.id, t);
              } else {
                const migration = t.migrations?.['1.2.9'];
                if (migration) {
                  acc.migratedIds.add(migration.id);
                }
              }
              if (t.shortcut) {
                acc.seenShortcuts.add(t.shortcut);
              }
              return acc;
            },
            {
              ids: new Set<string>(),
              migratedIds: new Set<string>(),
              predefinedTemplates: new Map<string, TemplatePredefined>(),
              seenShortcuts: new Set<string>(),
            },
          );

          for (const [index, legacyTemplate] of Object.entries(legacyData)) {
            try {
              const validatedTemplate: LegacyTemplateDefinition = context.validationService.validateSchema(
                legacyTemplate,
                LegacyTemplateDefinitionSchema,
                {
                  code: 'MIG422000',
                  parentLogger: this.logger,
                  parentPath: ['templates', index],
                },
              );

              const normalizedShortcut = normalizeTemplateShortcut(validatedTemplate.shortcut);
              const shortcut = normalizedShortcut && !seenShortcuts.has(normalizedShortcut) ? normalizedShortcut : null;

              if (validatedTemplate.readOnly) {
                const predefinedTemplate = predefinedTemplates.get(validatedTemplate.key);
                if (!predefinedTemplate) {
                  this.logger.warn('Skipping legacy predefined template as no longer bundled with extension', {
                    legacy: validatedTemplate,
                  });
                } else {
                  predefinedTemplate.enabled = validatedTemplate.enabled;
                  if (shortcut) {
                    const previousShortcut = predefinedTemplate.shortcut;
                    predefinedTemplate.shortcut = shortcut;
                    seenShortcuts.add(shortcut);
                    if (previousShortcut) {
                      seenShortcuts.delete(previousShortcut);
                    }
                  }

                  this.logger.debug('Migrated legacy predefined template', {
                    legacy: validatedTemplate,
                    migrated: predefinedTemplate,
                  });
                }
              } else if (migratedIds.has(validatedTemplate.key)) {
                this.logger.warn('Skipping legacy user-defined template as already migrated', {
                  legacy: validatedTemplate,
                });
              } else {
                const id = this.idGenerator.generate(ids);
                const migratedTemplate: TemplateUserDefined = {
                  content: validatedTemplate.content || ' ',
                  description: null,
                  enabled: validatedTemplate.enabled,
                  id,
                  migrations: {
                    [context.oldVersion]: {
                      id: validatedTemplate.key,
                      version: context.newVersion,
                    },
                  },
                  predefined: false,
                  shortcut,
                  title: validatedTemplate.title,
                };

                this.logger.debug('Migrated legacy user-defined template', {
                  legacy: validatedTemplate,
                  migrated: migratedTemplate,
                });

                data.templates.push(migratedTemplate);
                ids.add(id);
                migratedIds.add(validatedTemplate.key);
                if (shortcut) {
                  seenShortcuts.add(shortcut);
                }
              }
            } catch (e) {
              this.logger.error(`Failed to migrate legacy template at index ${index}`, e, {
                legacy: legacyTemplate,
              });

              errors.push(ExtensionError.fallback(e, 'MIG500900', index));
            }
          }

          // TODO: Sort templates based on legacyTemplates ordering somehow? Legacy templates have "index" property. Best effort?

          return errors.length
            ? { errors: errors as [ExtensionError, ...ExtensionError[]], outcome: DataMigrationStepOutcome.Failed }
            : { outcome: DataMigrationStepOutcome.Passed };
        },
      ),
      builder.createSimpleStepForTransfer(
        '1.2.9',
        'data_namespace_template_migration_step_6',
        { key: 'toolbar', schema: LegacyTemplateToolbarDataSchema, storage: 'local' },
        this.repository,
        (data, legacyData) => {
          if (legacyData.close !== undefined) {
            data.action.popup.autoCloseEnabled = legacyData.close;
          }
          if (legacyData.key) {
            const template = data.templates.find((t) => {
              if (t.predefined) {
                return t.id === legacyData.key;
              }
              const migration = t.migrations?.['1.2.9'];
              return migration?.id === legacyData.key;
            });
            if (template) {
              data.action.templateId = template.id;
            }
          }
          if (legacyData.options !== undefined) {
            data.action.popup.optionLinkEnabled = legacyData.options;
          }
          if (legacyData.popup !== undefined) {
            data.action.mode = legacyData.popup ? TemplateActionMode.Popup : TemplateActionMode.Template;
          }
        },
      ),
    ];
  }
}
