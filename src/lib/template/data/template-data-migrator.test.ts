import { describe, expect, it } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { DataMigrationOutcome } from 'extension/common/data/migration/data-migration-outcome.enum';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { TemplateDataMigrator } from 'extension/template/data/template-data-migrator';
import { TemplateDataRepository } from 'extension/template/data/template-data.repository';
import { type TemplateData } from 'extension/template/data/template-data.schema';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import { createMigrationContext, nonMigrationVersion } from 'extension/test/migration.fake';

const SEED: TemplateData = {
  action: {
    mode: TemplateActionMode.Popup,
    popup: {
      autoCloseEnabled: true,
      optionLinkEnabled: true,
    },
    templateId: 'PREDEFINED.00001',
  },
  contextMenu: {
    autoPasteEnabled: false,
    enabled: true,
    mode: TemplateContextMenuMode.Menu,
    optionLinkEnabled: true,
  },
  link: {
    target: false,
    title: false,
  },
  markdown: {
    inline: false,
  },
  shortcuts: {
    autoPasteEnabled: false,
    enabled: true,
  },
  templates: [
    { enabled: true, id: 'PREDEFINED.00001', predefined: true, shortcut: 'U' },
    { enabled: true, id: 'PREDEFINED.00002', predefined: true, shortcut: 'S' },
  ],
};

const createMigrator = (seed: TemplateData = SEED) => {
  const target = new FakeDataStorage({ [DataNamespace.Template]: structuredClone(seed) });
  const logging = createLoggingServiceMock();
  const repository = new TemplateDataRepository(
    { sync: target } as unknown as DataService,
    logging as unknown as LoggingService,
    new ValidationService(createLoggingServiceMock() as unknown as LoggingService),
  );
  const migrator = new TemplateDataMigrator(
    asIntlService(createIntlServiceMock()),
    logging as unknown as LoggingService,
    repository,
    new ValidationService(createLoggingServiceMock() as unknown as LoggingService),
  );

  return { logging, migrator, target };
};

const getTargetData = (target: FakeDataStorage): TemplateData =>
  target.snapshot()[DataNamespace.Template] as TemplateData;

const expectPassed = (result: unknown, description: string) => {
  expect(result).toEqual({ description, outcome: DataMigrationOutcome.Passed });
};

describe('TemplateDataMigrator', () => {
  it('reports the template namespace and title', () => {
    const { migrator } = createMigrator();

    expect(migrator.namespace).toBe(DataNamespace.Template);
    expect(migrator.namespaceTitle).toBe('data_namespace_template');
  });

  describe('isMigrationRequired', () => {
    it('is required when upgrading from 1.2.9 with any legacy template key present', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ links: { target: true } });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(true);
    });

    it('is not required from a different version', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ links: { target: true } }, { oldVersion: nonMigrationVersion });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });

    it('is not required when all legacy template keys are absent', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ unrelated: true });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });
  });

  it('returns the required migration step descriptions for the legacy keys that are present', async () => {
    const { migrator } = createMigrator();
    const { context } = createMigrationContext({
      links: {},
      markdown: {},
      menu: {},
      shortcuts: {},
      templates: [],
      toolbar: {},
    });

    await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual([
      'data_namespace_template_migration_step_1',
      'data_namespace_template_migration_step_2',
      'data_namespace_template_migration_step_3',
      'data_namespace_template_migration_step_4',
      'data_namespace_template_migration_step_5',
      'data_namespace_template_migration_step_6',
    ]);
  });

  describe('migrate', () => {
    it('transfers legacy link options and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ links: { target: true, title: true } });

      const results = await migrator.migrate(context);

      expectPassed(results[0], 'data_namespace_template_migration_step_1');
      expect(getTargetData(target).link).toEqual({ target: true, title: true });
      await expect(local.has('links')).resolves.toBe(false);
    });

    it('ignores garbage legacy link options, leaves data untouched, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ links: { target: 'yes', title: 1 } });

      await migrator.migrate(context);

      expect(getTargetData(target).link).toEqual(SEED.link);
      await expect(local.has('links')).resolves.toBe(false);
    });

    it('transfers legacy markdown options and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ markdown: { inline: true } });

      const results = await migrator.migrate(context);

      expectPassed(results[0], 'data_namespace_template_migration_step_2');
      expect(getTargetData(target).markdown.inline).toBe(true);
      await expect(local.has('markdown')).resolves.toBe(false);
    });

    it('ignores garbage legacy markdown options, leaves data untouched, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ markdown: { inline: 'yes' } });

      await migrator.migrate(context);

      expect(getTargetData(target).markdown).toEqual(SEED.markdown);
      await expect(local.has('markdown')).resolves.toBe(false);
    });

    it('transfers legacy context menu options and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ menu: { enabled: false, options: false, paste: true } });

      const results = await migrator.migrate(context);

      expectPassed(results[0], 'data_namespace_template_migration_step_3');
      expect(getTargetData(target).contextMenu).toEqual({
        autoPasteEnabled: true,
        enabled: false,
        mode: TemplateContextMenuMode.Menu,
        optionLinkEnabled: false,
      });
      await expect(local.has('menu')).resolves.toBe(false);
    });

    it('ignores garbage legacy context menu options, leaves data untouched, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ menu: 'enabled' });

      await migrator.migrate(context);

      expect(getTargetData(target).contextMenu).toEqual(SEED.contextMenu);
      await expect(local.has('menu')).resolves.toBe(false);
    });

    it('transfers legacy shortcut options and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ shortcuts: { enabled: false, paste: true } });

      const results = await migrator.migrate(context);

      expectPassed(results[0], 'data_namespace_template_migration_step_4');
      expect(getTargetData(target).shortcuts).toEqual({ autoPasteEnabled: true, enabled: false });
      await expect(local.has('shortcuts')).resolves.toBe(false);
    });

    it('ignores garbage legacy shortcut options, leaves data untouched, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ shortcuts: null });

      await migrator.migrate(context);

      expect(getTargetData(target).shortcuts).toEqual(SEED.shortcuts);
      await expect(local.has('shortcuts')).resolves.toBe(false);
    });

    // BUG: custom templates can never pass TemplateDataTemplateSchema because migrateTemplatesFromV1 never supplies
    // the required nullable description field. Users lose every saved custom template during migration. Suggested fix:
    // add description: null while building migrated custom templates, then keep the duplicate-ID guard effective.
    it('updates predefined templates but skips valid custom templates (BUG: should preserve custom templates)', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({
        templates: [
          { enabled: false, key: 'PREDEFINED.00001', predefined: true, shortcut: '' },
          {
            content: 'Custom content',
            enabled: true,
            key: 'CUSTOM.00001',
            predefined: false,
            shortcut: '',
            title: 'Custom template',
          },
        ],
      });

      const results = await migrator.migrate(context);

      expectPassed(results[0], 'data_namespace_template_migration_step_5');
      expect(getTargetData(target).templates).toEqual([
        { enabled: false, id: 'PREDEFINED.00001', predefined: true, shortcut: null },
        { enabled: true, id: 'PREDEFINED.00002', predefined: true, shortcut: 'S' },
      ]);
      await expect(local.has('templates')).resolves.toBe(false);
    });

    it('ignores garbage legacy templates, leaves data untouched, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({
        templates: [
          null,
          'template',
          { content: '', enabled: true, key: 'CUSTOM.INVALID', predefined: false, shortcut: 'XY', title: '' },
        ],
      });

      await migrator.migrate(context);

      expect(getTargetData(target).templates).toEqual(SEED.templates);
      await expect(local.has('templates')).resolves.toBe(false);
    });

    it('does not append duplicate custom template IDs because custom migration is currently blocked', async () => {
      const { migrator, target } = createMigrator();
      const { context } = createMigrationContext({
        templates: [
          {
            content: 'First',
            enabled: true,
            key: 'CUSTOM.DUPLICATE',
            predefined: false,
            shortcut: 'F',
            title: 'First',
          },
          {
            content: 'Second',
            enabled: false,
            key: 'CUSTOM.DUPLICATE',
            predefined: false,
            shortcut: 'S',
            title: 'Second',
          },
        ],
      });

      await migrator.migrate(context);

      expect(getTargetData(target).templates).toEqual(SEED.templates);
    });

    // BUG: the skip path for a predefined legacy template with no matching predefined target logs an empty string. Users
    // and support cannot tell which template was skipped or why. Suggested fix: log a descriptive warning with the ID.
    it('logs an empty warning for skipped predefined templates (BUG: should explain the skip)', async () => {
      const { logging, migrator } = createMigrator();
      const { context } = createMigrationContext({
        templates: [{ enabled: true, key: 'PREDEFINED.MISSING', predefined: true, shortcut: 'M' }],
      });

      await migrator.migrate(context);

      expect(logging.logger.warn).toHaveBeenCalledWith('');
    });

    it('transfers legacy toolbar options when the selected template exists and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({
        toolbar: { close: false, key: 'PREDEFINED.00002', options: false, popup: false },
      });

      const results = await migrator.migrate(context);

      expectPassed(results[0], 'data_namespace_template_migration_step_6');
      expect(getTargetData(target).action).toEqual({
        mode: TemplateActionMode.Template,
        popup: {
          autoCloseEnabled: false,
          optionLinkEnabled: false,
        },
        templateId: 'PREDEFINED.00002',
      });
      await expect(local.has('toolbar')).resolves.toBe(false);
    });

    it('does not transfer a legacy toolbar template ID that has no matching template', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({
        toolbar: { close: false, key: 'CUSTOM.MISSING', options: false, popup: false },
      });

      await migrator.migrate(context);

      expect(getTargetData(target).action.templateId).toBe('PREDEFINED.00001');
      await expect(local.has('toolbar')).resolves.toBe(false);
    });

    it('ignores garbage legacy toolbar options, leaves data untouched, and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({ toolbar: false });

      await migrator.migrate(context);

      expect(getTargetData(target).action).toEqual(SEED.action);
      await expect(local.has('toolbar')).resolves.toBe(false);
    });

    // BUG: AbstractDataMigrator runs required steps concurrently, but TemplateDataMigrator steps mutate the same
    // repository with read-modify-write operations. With multiple legacy keys, the last writer wins, so earlier step
    // changes are lost and toolbar cannot select a custom template created by the templates step. Suggested fix: run
    // steps for a namespace sequentially, or serialize repository mutations.
    it('persists only the last concurrent repository mutation (BUG: should merge every step result)', async () => {
      const { migrator, target } = createMigrator();
      const { context, local } = createMigrationContext({
        links: { target: true, title: true },
        templates: [
          {
            content: 'Custom content',
            enabled: true,
            key: 'CUSTOM.TOOLBAR',
            predefined: false,
            shortcut: 'C',
            title: 'Custom toolbar template',
          },
        ],
        toolbar: { close: false, key: 'CUSTOM.TOOLBAR', options: false, popup: false },
      });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'data_namespace_template_migration_step_1', outcome: DataMigrationOutcome.Passed },
        { description: 'data_namespace_template_migration_step_5', outcome: DataMigrationOutcome.Passed },
        { description: 'data_namespace_template_migration_step_6', outcome: DataMigrationOutcome.Passed },
      ]);
      expect(getTargetData(target)).toEqual({
        ...SEED,
        action: {
          mode: TemplateActionMode.Template,
          popup: { autoCloseEnabled: false, optionLinkEnabled: false },
          templateId: 'PREDEFINED.00001',
        },
      });
      await expect(local.hasAny(['links', 'templates', 'toolbar'])).resolves.toBe(false);
    });
  });
});
