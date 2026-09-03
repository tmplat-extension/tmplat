import { describe, expect, it, vi } from 'vitest';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { DataMigrationStepOutcome } from 'extension/common/data/migration/data-migration-step-outcome.enum';
import { type DataMigrationStepResult } from 'extension/common/data/migration/data-migration.model';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { TemplateCollectionRepository } from 'extension/template/data/template-collection.repository';
import { TemplateDataMigrator } from 'extension/template/data/template-data-migrator';
import { TemplateDataRepository } from 'extension/template/data/template-data.repository';
import { type TemplateDefinition, type TemplateSettings } from 'extension/template/data/template-data.schema';
import { TemplateMigrationRepository } from 'extension/template/data/template-migration.repository';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { TemplateIdGenerator } from 'extension/template/template-id-generator';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { asIntlService, createIntlServiceMock } from 'extension/test/intl.mock';
import { createLoggingServiceMock } from 'extension/test/logger.mock';
import {
  createMigrationContext,
  createNotRequiredStepResult,
  nonMigrationVersion,
} from 'extension/test/migration.fake';

const TEMPLATE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const generatedId = (index: number) => `${index}`.repeat(8) + '-0000-4000-8000-000000000000';
type TemplateMigrationSeed = TemplateSettings & { templates: TemplateDefinition[] };

const SEED: TemplateMigrationSeed = {
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
    templateId: null,
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

/** The settings half of {@link SEED}, which is all the settings namespace holds now templates are their own collection. */
const { templates: _seedTemplates, ...SEED_SETTINGS } = SEED;

const createMigrator = (
  seed: TemplateMigrationSeed | Record<string, never> = SEED,
  realIdGenerator?: TemplateIdGenerator,
) => {
  const { templates, ...settings } = structuredClone(Object.keys(seed).length ? (seed as TemplateMigrationSeed) : SEED);
  const target = new FakeDataStorage({ [DataNamespace.Template]: settings });
  // Templates live in their own local-storage collection, one key per item plus an order index
  const collectionTarget = new FakeDataStorage({
    [`${DataNamespace.Template}:index`]: templates.map((template) => template.id),
    ...Object.fromEntries(templates.map((template) => [`${DataNamespace.Template}:item:${template.id}`, template])),
  });
  const logging = createLoggingServiceMock();
  const dataService = { local: collectionTarget, sync: target } as unknown as DataService;
  const validationService = new ValidationService(createLoggingServiceMock() as unknown as LoggingService);
  const collectionRepository = new TemplateCollectionRepository(
    dataService,
    logging as unknown as LoggingService,
    validationService,
  );
  const repository = new TemplateMigrationRepository(
    new TemplateDataRepository(
      dataService,
      logging as unknown as LoggingService,
      validationService,
      collectionRepository,
    ),
    collectionRepository,
  );
  let generated = 0;
  // The migrator mutates the exclusion set in place between calls, so it has to be snapshotted as it is received
  const exclusionSnapshots: string[][] = [];
  const templateIdGenerator = {
    generate: vi.fn((exclusions?: ReadonlySet<string>) => {
      exclusionSnapshots.push([...(exclusions ?? [])]);

      if (realIdGenerator) {
        return realIdGenerator.generate(exclusions);
      }

      const id = generated === 0 ? TEMPLATE_ID : generatedId(generated);
      generated += 1;

      return id;
    }),
  } as unknown as TemplateIdGenerator;
  const migrator = new TemplateDataMigrator(
    asIntlService(createIntlServiceMock()),
    logging as unknown as LoggingService,
    repository,
    templateIdGenerator,
  );

  return { collectionTarget, exclusionSnapshots, idGenerator: templateIdGenerator, logging, migrator, target };
};

const createLegacyTemplate = (overrides: Record<string, unknown> = {}) => ({
  content: 'Custom content',
  enabled: true,
  image: 'globe',
  index: 0,
  key: 'CUSTOM.00001',
  readOnly: false,
  shortcut: '',
  title: 'Custom template',
  usage: 0,
  ...overrides,
});

const getTargetData = (target: FakeDataStorage): TemplateSettings =>
  target.snapshot()[DataNamespace.Template] as TemplateSettings;

/** Rebuilds the ordered template list from the collection's per-item keys and its order index. */
const getTemplates = (collectionTarget: FakeDataStorage): TemplateDefinition[] => {
  const snapshot = collectionTarget.snapshot();
  const order = (snapshot[`${DataNamespace.Template}:index`] as string[] | undefined) ?? [];

  return order
    .map((id) => snapshot[`${DataNamespace.Template}:item:${id}`] as TemplateDefinition | undefined)
    .filter((template): template is TemplateDefinition => template != null);
};

// Templates are looked up by ID rather than by position, since the migrator restores the order the user had in 1.x
const getTemplate = (collectionTarget: FakeDataStorage, id: string) =>
  getTemplates(collectionTarget).find((t) => t.id === id);

const getTemplateIds = (collectionTarget: FakeDataStorage) => getTemplates(collectionTarget).map((t) => t.id);

const templateStepDescription = (step: number) => `migrate_namespace_template_migration_step_${step}`;

// `migrate()` reports a result for every step, not just the required ones, so a test targeting a single step still
// has to account for the five it deliberately left alone
const expectOnlyPassed = (results: DataMigrationStepResult[], step: number) => {
  expect(results).toEqual(
    [1, 2, 3, 4, 5, 6].map((current) =>
      current === step
        ? { description: templateStepDescription(current), outcome: DataMigrationStepOutcome.Passed }
        : createNotRequiredStepResult(templateStepDescription(current)),
    ),
  );
};

describe('TemplateDataMigrator', () => {
  it('reports the template namespace and title', () => {
    const { migrator } = createMigrator();

    expect(migrator.namespace).toBe(DataNamespace.Template);
    expect(migrator.namespaceTitle).toBe('migrate_namespace_template');
  });

  describe('isMigrationRequired', () => {
    it('is required when upgrading from 1.2.9 with any legacy template key present', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ legacyData: { local: { links: { target: true } } } });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(true);
    });

    it('is not required from a different version', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: { local: { links: { target: true } } },
        oldVersion: nonMigrationVersion,
      });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });

    it('is not required when all legacy template keys are absent', async () => {
      const { migrator } = createMigrator();
      const { context } = createMigrationContext({ legacyData: { local: { unrelated: true } } });

      await expect(migrator.isMigrationRequired(context)).resolves.toBe(false);
    });
  });

  it('returns the required migration step descriptions for the legacy keys that are present', async () => {
    const { migrator } = createMigrator();
    const { context } = createMigrationContext({
      legacyData: {
        local: {
          links: {},
          markdown: {},
          menu: {},
          shortcuts: {},
          templates: [],
          toolbar: {},
        },
      },
    });

    await expect(migrator.getRequiredMigrationSteps(context)).resolves.toEqual([
      'migrate_namespace_template_migration_step_1',
      'migrate_namespace_template_migration_step_2',
      'migrate_namespace_template_migration_step_3',
      'migrate_namespace_template_migration_step_4',
      'migrate_namespace_template_migration_step_5',
      'migrate_namespace_template_migration_step_6',
    ]);
  });

  describe('migrate', () => {
    it('transfers legacy link options and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { links: { target: true, title: true } } } });

      const results = await migrator.migrate(context);

      expectOnlyPassed(results, 1);
      expect(getTargetData(target).link).toEqual({ target: true, title: true });
      await expect(local.has('links')).resolves.toBe(false);
    });

    it('fails the step and retains the legacy key when legacy link options are malformed', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { links: { target: 'yes', title: 1 } } } });

      const results = await migrator.migrate(context);

      // Malformed legacy data used to be silently ignored and its key deleted anyway; now the step reports a
      // MIG422000 failure and leaves the key in place so the migration can be retried
      expect(results[0]).toMatchObject({
        description: 'migrate_namespace_template_migration_step_1',
        outcome: DataMigrationStepOutcome.Failed,
      });
      expect(results[0]?.errors?.[0]).toMatchObject({ code: 'MIG422000' });
      expect(getTargetData(target).link).toEqual(SEED.link);
      await expect(local.has('links')).resolves.toBe(true);
    });

    it('transfers only the legacy link options that are present', async () => {
      const { migrator, target } = createMigrator();
      const { context } = createMigrationContext({ legacyData: { local: { links: { title: true } } } });

      await migrator.migrate(context);

      expect(getTargetData(target).link).toEqual({ ...SEED.link, title: true });
    });

    it('transfers legacy markdown options and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { markdown: { inline: true } } } });

      const results = await migrator.migrate(context);

      expectOnlyPassed(results, 2);
      expect(getTargetData(target).markdown.inline).toBe(true);
      await expect(local.has('markdown')).resolves.toBe(false);
    });

    it('fails the step and retains the legacy key when legacy markdown options are malformed', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { markdown: { inline: 'yes' } } } });

      const results = await migrator.migrate(context);

      expect(results[1]).toMatchObject({
        description: templateStepDescription(2),
        errors: [expect.objectContaining({ code: 'MIG422000' })],
        outcome: DataMigrationStepOutcome.Failed,
      });
      expect(getTargetData(target).markdown).toEqual(SEED.markdown);
      await expect(local.has('markdown')).resolves.toBe(true);
    });

    it('transfers legacy context menu options and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { menu: { enabled: false, options: false } } } });

      const results = await migrator.migrate(context);

      expectOnlyPassed(results, 3);
      expect(getTargetData(target).contextMenu).toEqual({
        autoPasteEnabled: false,
        enabled: false,
        mode: TemplateContextMenuMode.Menu,
        optionLinkEnabled: false,
        templateId: null,
      });
      await expect(local.has('menu')).resolves.toBe(false);
    });

    it('fails the step and retains the legacy key when legacy context menu options are malformed', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { menu: 'enabled' } } });

      const results = await migrator.migrate(context);

      expect(results[2]).toMatchObject({
        description: templateStepDescription(3),
        errors: [expect.objectContaining({ code: 'MIG422000' })],
        outcome: DataMigrationStepOutcome.Failed,
      });
      expect(getTargetData(target).contextMenu).toEqual(SEED.contextMenu);
      await expect(local.has('menu')).resolves.toBe(true);
    });

    it('transfers legacy shortcut options and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { shortcuts: { enabled: false, paste: true } } } });

      const results = await migrator.migrate(context);

      expectOnlyPassed(results, 4);
      expect(getTargetData(target).shortcuts).toEqual({ autoPasteEnabled: true, enabled: false });
      await expect(local.has('shortcuts')).resolves.toBe(false);
    });

    it('fails the step and retains the legacy key when legacy shortcut options are malformed', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { shortcuts: null } } });

      const results = await migrator.migrate(context);

      expect(results[3]).toMatchObject({
        description: templateStepDescription(4),
        errors: [expect.objectContaining({ code: 'MIG422000' })],
        outcome: DataMigrationStepOutcome.Failed,
      });
      expect(getTargetData(target).shortcuts).toEqual(SEED.shortcuts);
      await expect(local.has('shortcuts')).resolves.toBe(true);
    });

    // Regression guard for BUG A (fixed): migrated user-defined templates omitted `description`, which
    // `TemplateUserDefinedSchema` declares as nullable-but-REQUIRED, so every custom template silently failed
    // validation and was discarded while the step still reported Passed.
    it('preserves user-defined templates, giving each a generated ID and a null description', async () => {
      const { collectionTarget, migrator } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            templates: [
              createLegacyTemplate({ enabled: false, key: 'PREDEFINED.00001', readOnly: true, shortcut: 'U' }),
              createLegacyTemplate({ key: 'CUSTOM.00001', shortcut: 'C' }),
            ],
          },
        },
      });

      const results = await migrator.migrate(context);

      expectOnlyPassed(results, 5);
      expect(getTemplates(collectionTarget)).toEqual([
        { enabled: false, id: 'PREDEFINED.00001', predefined: true, shortcut: 'U' },
        {
          content: 'Custom content',
          description: null,
          enabled: true,
          id: TEMPLATE_ID,
          migrations: { '1.2.9': { id: 'CUSTOM.00001', version: '2.0.0' } },
          predefined: false,
          shortcut: 'C',
          title: 'Custom template',
        },
        // Not present in the legacy list, so it is new in this version and sorts after the user's own templates
        { enabled: true, id: 'PREDEFINED.00002', predefined: true, shortcut: 'S' },
      ]);
      await expect(local.has('templates')).resolves.toBe(false);
    });

    it('records the legacy key under migrations so a re-run is idempotent', async () => {
      const { collectionTarget, migrator, target } = createMigrator();
      const legacyData = { local: { templates: [createLegacyTemplate({ key: 'CUSTOM.00001' })] } };

      await migrator.migrate(createMigrationContext({ legacyData }).context);

      const afterFirstRun = getTemplates(collectionTarget);

      // Re-seed the legacy key to simulate a retry that reaches an already-migrated template
      const { context } = createMigrationContext({ legacyData });
      const { collectionTarget: secondCollectionTarget, migrator: second } = createMigrator({
        ...getTargetData(target),
        templates: getTemplates(collectionTarget),
      });

      await second.migrate(context);

      expect(afterFirstRun).toHaveLength(3);
      expect(getTemplates(secondCollectionTarget)).toEqual(afterFirstRun);
    });

    it('drops a legacy shortcut that is already taken by an existing template', async () => {
      const { collectionTarget, migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: { local: { templates: [createLegacyTemplate({ shortcut: 'U' })] } },
      });

      await migrator.migrate(context);

      expect(getTemplate(collectionTarget, TEMPLATE_ID)).toMatchObject({ id: TEMPLATE_ID, shortcut: null });
    });

    it('drops a legacy shortcut that is not a single upper-case alphanumeric character', async () => {
      const { collectionTarget, migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: { local: { templates: [createLegacyTemplate({ shortcut: 'xy' })] } },
      });

      await migrator.migrate(context);

      expect(getTemplate(collectionTarget, TEMPLATE_ID)).toMatchObject({ shortcut: null });
    });

    // 1.x validated shortcuts with an unanchored, case-insensitive `/[A-Z0-9]/i` and only upper-cased them in the
    // options wizard, so its import path could persist a lower-case shortcut. Normalizing preserves it instead of
    // silently discarding it, and keeps this in step with `TemplateTransferSchema` on the import path.
    it.each([
      ['lower case', 'c', 'C'],
      ['surrounded by whitespace', ' c ', 'C'],
    ])('normalizes a legacy shortcut that is %s', async (_label, shortcut, expected) => {
      const { collectionTarget, migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: { local: { templates: [createLegacyTemplate({ shortcut })] } },
      });

      await migrator.migrate(context);

      expect(getTemplate(collectionTarget, TEMPLATE_ID)).toMatchObject({ shortcut: expected });
    });

    it('drops a legacy shortcut that only collides with an existing one once normalized', async () => {
      const { collectionTarget, migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: { local: { templates: [createLegacyTemplate({ shortcut: 'u' })] } },
      });

      await migrator.migrate(context);

      expect(getTemplate(collectionTarget, TEMPLATE_ID)).toMatchObject({ id: TEMPLATE_ID, shortcut: null });
    });

    it('applies enabled and shortcut from a legacy predefined template to its bundled counterpart', async () => {
      const { collectionTarget, migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: {
          local: {
            templates: [
              createLegacyTemplate({ enabled: false, key: 'PREDEFINED.00002', readOnly: true, shortcut: 'Z' }),
            ],
          },
        },
      });

      await migrator.migrate(context);

      expect(getTemplate(collectionTarget, 'PREDEFINED.00002')).toEqual({
        enabled: false,
        id: 'PREDEFINED.00002',
        predefined: true,
        shortcut: 'Z',
      });
    });

    // Regression guard for BUG H (fixed): the predefined branch used to assign a shortcut without recording it in
    // `seenShortcuts`, so a later legacy user-defined template could claim the very same shortcut.
    it('does not let a user-defined template reuse a shortcut just assigned to a predefined template', async () => {
      const { collectionTarget, migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: {
          local: {
            templates: [
              createLegacyTemplate({ key: 'PREDEFINED.00002', readOnly: true, shortcut: 'Z' }),
              createLegacyTemplate({ key: 'CUSTOM.00001', shortcut: 'Z' }),
            ],
          },
        },
      });

      await migrator.migrate(context);

      expect(getTemplate(collectionTarget, 'PREDEFINED.00002')).toMatchObject({
        id: 'PREDEFINED.00002',
        shortcut: 'Z',
      });
      // 'Z' was claimed by PREDEFINED.00002 earlier in this very migration
      expect(getTemplate(collectionTarget, TEMPLATE_ID)).toMatchObject({ id: TEMPLATE_ID, shortcut: null });
    });

    it('assigns a shortcut to a predefined template that had none', async () => {
      const { collectionTarget, migrator } = createMigrator({
        ...SEED_SETTINGS,
        templates: [{ enabled: true, id: 'PREDEFINED.00001', predefined: true, shortcut: null }],
      });
      const { context } = createMigrationContext({
        legacyData: {
          local: {
            templates: [createLegacyTemplate({ key: 'PREDEFINED.00001', readOnly: true, shortcut: 'Z' })],
          },
        },
      });

      await migrator.migrate(context);

      expect(getTemplate(collectionTarget, 'PREDEFINED.00001')).toMatchObject({
        id: 'PREDEFINED.00001',
        shortcut: 'Z',
      });
    });

    it('frees the shortcut a predefined template gave up, so a later template may claim it', async () => {
      const { collectionTarget, migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: {
          local: {
            templates: [
              // PREDEFINED.00002 is seeded with 'S' and moves to 'Z', releasing 'S'
              createLegacyTemplate({ key: 'PREDEFINED.00002', readOnly: true, shortcut: 'Z' }),
              createLegacyTemplate({ key: 'CUSTOM.00001', shortcut: 'S' }),
            ],
          },
        },
      });

      await migrator.migrate(context);

      expect(getTemplate(collectionTarget, TEMPLATE_ID)).toMatchObject({ id: TEMPLATE_ID, shortcut: 'S' });
    });

    // Regression guard for BUG F (fixed): `generate()` used to be handed `migratedIds`, which holds LEGACY keys
    // ('CUSTOM.OLD') and never a generated UUID, so the exclusion set was inert and nothing guarded a collision with
    // an existing template ID.
    it('excludes every existing template ID when generating a new one', async () => {
      const { exclusionSnapshots, migrator } = createMigrator({
        ...SEED_SETTINGS,
        templates: [
          ...SEED.templates,
          {
            content: 'Already migrated',
            description: null,
            enabled: true,
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            migrations: { '1.2.9': { id: 'CUSTOM.OLD', version: '2.0.0' } },
            predefined: false,
            shortcut: null,
            title: 'Already migrated',
          },
        ],
      });
      const { context } = createMigrationContext({
        legacyData: { local: { templates: [createLegacyTemplate({ key: 'CUSTOM.NEW' })] } },
      });

      await migrator.migrate(context);

      expect(exclusionSnapshots).toEqual([
        ['PREDEFINED.00001', 'PREDEFINED.00002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
      ]);
    });

    // Regression guard for BUG F (fixed): generated IDs used not to be fed back into the exclusion set, so two
    // templates migrated in the same pass were distinct only by luck. Driven through the REAL generator, since a
    // stubbed one cannot demonstrate that the exclusion set is what keeps them apart.
    it('adds each generated ID to the exclusions so templates migrated together stay distinct', async () => {
      const { collectionTarget, exclusionSnapshots, migrator } = createMigrator({}, new TemplateIdGenerator());
      const { context } = createMigrationContext({
        legacyData: {
          local: {
            templates: [
              createLegacyTemplate({ key: 'CUSTOM.00001', shortcut: 'A' }),
              createLegacyTemplate({ key: 'CUSTOM.00002', shortcut: 'B' }),
            ],
          },
        },
      });

      await migrator.migrate(context);

      const ids = getTemplates(collectionTarget).map((t) => t.id);

      expect(new Set(ids).size).toBe(4);
      // The second generation must already know about the ID handed out by the first
      expect(exclusionSnapshots[1]).toContain(ids[2]);
    });

    it('fails the step and retains the legacy key when legacy templates are not an array', async () => {
      const { collectionTarget, migrator } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { templates: { 'CUSTOM.A': {} } } } });

      const results = await migrator.migrate(context);

      expect(results[4]).toMatchObject({
        description: 'migrate_namespace_template_migration_step_5',
        outcome: DataMigrationStepOutcome.Failed,
      });
      expect(results[4]?.errors?.[0]).toMatchObject({ code: 'MIG422000' });
      expect(getTemplates(collectionTarget)).toEqual(SEED.templates);
      await expect(local.has('templates')).resolves.toBe(true);
    });

    it('collects an error per malformed legacy template and cancels the whole step', async () => {
      const { collectionTarget, migrator } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            templates: [
              createLegacyTemplate({ key: 'CUSTOM.VALID' }),
              createLegacyTemplate({ key: 'CUSTOM.NO_TITLE', title: '' }),
              createLegacyTemplate({ key: 'CUSTOM.NO_INDEX', index: undefined }),
              createLegacyTemplate({ key: 'CUSTOM.BAD_FLAG', readOnly: 'yes' }),
            ],
          },
        },
      });

      const results = await migrator.migrate(context);

      expect(results[4]).toMatchObject({
        description: templateStepDescription(5),
        outcome: DataMigrationStepOutcome.Failed,
      });
      expect(results[4]?.errors).toHaveLength(3);
      // `ExtensionError.fallback` keeps the underlying MIG422000, so each error still names the offending entry
      expect(results[4]?.errors?.map((e) => e.code)).toEqual(['MIG422000', 'MIG422000', 'MIG422000']);
      // The valid template is rolled back along with the rest, so the whole step can be retried from the legacy data
      expect(getTemplates(collectionTarget)).toEqual(SEED.templates);
      await expect(local.has('templates')).resolves.toBe(true);
    });

    // Regression guard for BUG G (fixed): `LegacyTemplateDefinitionSchema.content` used to be `z.string().nonempty()`,
    // but 1.x only ever required a *title* (options.coffee:1137-1155 `validateTemplate`) and defaulted content to ''
    // (background.coffee `templates[idx].content ?= ''`). A single content-less legacy template therefore failed the
    // entire all-or-nothing templates step, so the user migrated NONE of their templates — unrecoverably, since a
    // retry failed identically. `TemplateUserDefined.content` is still `nonempty()`, so it is substituted with ' '.
    it('substitutes a placeholder for empty legacy content rather than failing every template', async () => {
      const { collectionTarget, migrator } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            templates: [
              createLegacyTemplate({ key: 'CUSTOM.EMPTY', content: '', shortcut: 'E' }),
              createLegacyTemplate({ key: 'CUSTOM.GOOD', shortcut: 'G' }),
            ],
          },
        },
      });

      const results = await migrator.migrate(context);

      expectOnlyPassed(results, 5);
      // Both legacy entries default to `index: 0`, so they keep their relative order, and the bundled predefined
      // templates are absent from the legacy list so they sort after everything the user already had
      expect(getTemplates(collectionTarget).map((t) => (t.predefined ? t.id : t.content))).toEqual([
        ' ',
        'Custom content',
        'PREDEFINED.00001',
        'PREDEFINED.00002',
      ]);
      await expect(local.has('templates')).resolves.toBe(false);
    });

    // Regression guard: `migratedIds` used to be seeded only from stored data and never updated as templates were
    // pushed, so two legacy entries sharing a key both migrated as separate templates.
    /*
     * Ordering guards: 1.x stored an explicit `index` per template and sorted by it on load (`background.coffee:2061`),
     * so array position in the legacy data is NOT authoritative - these fixtures deliberately give `index` an order
     * that disagrees with the array order to prove which one is used.
     */
    describe('ordering', () => {
      it('restores the legacy order rather than the order the templates were processed in', async () => {
        const { collectionTarget, migrator } = createMigrator();
        const { context } = createMigrationContext({
          legacyData: {
            local: {
              templates: [
                createLegacyTemplate({ index: 3, key: 'PREDEFINED.00001', readOnly: true, shortcut: 'U' }),
                createLegacyTemplate({ index: 1, key: 'CUSTOM.00001', shortcut: 'C' }),
                createLegacyTemplate({ index: 2, key: 'PREDEFINED.00002', readOnly: true, shortcut: 'S' }),
              ],
            },
          },
        });

        await migrator.migrate(context);

        expect(getTemplateIds(collectionTarget)).toEqual([TEMPLATE_ID, 'PREDEFINED.00002', 'PREDEFINED.00001']);
      });

      it('sorts by the legacy index even when it disagrees with the legacy array order', async () => {
        const { collectionTarget, migrator } = createMigrator();
        const { context } = createMigrationContext({
          legacyData: {
            local: {
              templates: [
                createLegacyTemplate({ index: 10, key: 'PREDEFINED.00001', readOnly: true, shortcut: 'U' }),
                createLegacyTemplate({ index: 0, key: 'PREDEFINED.00002', readOnly: true, shortcut: 'S' }),
              ],
            },
          },
        });

        await migrator.migrate(context);

        expect(getTemplateIds(collectionTarget)).toEqual(['PREDEFINED.00002', 'PREDEFINED.00001']);
      });

      // A template bundled with 2.0 that the user never had cannot be placed within an order it was never part of,
      // so it goes after everything they did have rather than displacing their arrangement
      it('places templates with no legacy counterpart last, keeping their bundled order', async () => {
        const { collectionTarget, migrator } = createMigrator({
          ...SEED_SETTINGS,
          templates: [
            ...SEED.templates,
            { enabled: true, id: 'PREDEFINED.00003', predefined: true, shortcut: null },
            { enabled: true, id: 'PREDEFINED.00004', predefined: true, shortcut: null },
          ],
        });
        const { context } = createMigrationContext({
          legacyData: {
            local: {
              templates: [createLegacyTemplate({ index: 7, key: 'PREDEFINED.00002', readOnly: true, shortcut: 'S' })],
            },
          },
        });

        await migrator.migrate(context);

        expect(getTemplateIds(collectionTarget)).toEqual([
          'PREDEFINED.00002',
          'PREDEFINED.00001',
          'PREDEFINED.00003',
          'PREDEFINED.00004',
        ]);
      });

      // 1.x could produce duplicate indexes (`options.coffee:622` assigns `ext.templates.length` on add), so the
      // sort must be stable rather than arbitrary
      it('keeps the relative order of templates sharing a legacy index', async () => {
        const { collectionTarget, migrator } = createMigrator();
        const { context } = createMigrationContext({
          legacyData: {
            local: {
              templates: [
                createLegacyTemplate({ index: 4, key: 'PREDEFINED.00002', readOnly: true, shortcut: 'S' }),
                createLegacyTemplate({ index: 4, key: 'PREDEFINED.00001', readOnly: true, shortcut: 'U' }),
              ],
            },
          },
        });

        await migrator.migrate(context);

        // Both share index 4, so they keep the order they already had in `data.templates`
        expect(getTemplateIds(collectionTarget)).toEqual(['PREDEFINED.00001', 'PREDEFINED.00002']);
      });

      // Retry safety: a template skipped because it was already migrated still contributes its ordering, otherwise
      // re-running the step would push everything migrated on the previous pass to the end
      it('orders an already-migrated template from its legacy index rather than dropping it to the end', async () => {
        const { collectionTarget, migrator } = createMigrator({
          ...SEED_SETTINGS,
          templates: [
            ...SEED.templates,
            {
              content: 'Already migrated',
              description: null,
              enabled: true,
              id: TEMPLATE_ID,
              migrations: { '1.2.9': { id: 'CUSTOM.00001', version: '2.0.0' } },
              predefined: false,
              shortcut: null,
              title: 'Already migrated',
            },
          ],
        });
        const { context } = createMigrationContext({
          legacyData: {
            local: {
              templates: [
                createLegacyTemplate({ index: 0, key: 'CUSTOM.00001' }),
                createLegacyTemplate({ index: 1, key: 'PREDEFINED.00001', readOnly: true, shortcut: 'U' }),
              ],
            },
          },
        });

        await migrator.migrate(context);

        expect(getTemplateIds(collectionTarget)).toEqual([TEMPLATE_ID, 'PREDEFINED.00001', 'PREDEFINED.00002']);
      });
    });

    it('migrates only the first entry when a legacy key appears twice in the same array', async () => {
      const { collectionTarget, migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: {
          local: {
            templates: [
              createLegacyTemplate({ key: 'CUSTOM.DUPLICATE', title: 'First', shortcut: 'F' }),
              createLegacyTemplate({ key: 'CUSTOM.DUPLICATE', title: 'Second', shortcut: 'S2' }),
            ],
          },
        },
      });

      await migrator.migrate(context);

      const migrated = getTemplates(collectionTarget).filter((t) => !t.predefined);

      expect(migrated).toHaveLength(1);
      expect(migrated.map((t) => t.title)).toEqual(['First']);
    });

    // Regression guard for BUG D (fixed): this path used to call `logger.warn('')`, so a skipped predefined template
    // produced no diagnostic whatsoever.
    it('warns with an explanatory message when a legacy predefined template is no longer bundled', async () => {
      const { logging, migrator } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: {
          local: {
            templates: [createLegacyTemplate({ key: 'PREDEFINED.MISSING', readOnly: true, shortcut: 'M' })],
          },
        },
      });

      await migrator.migrate(context);

      expect(logging.logger.warn).toHaveBeenCalledWith(
        'Skipping legacy predefined template as no longer bundled with extension',
        { legacy: expect.objectContaining({ key: 'PREDEFINED.MISSING' }) },
      );
    });

    it('warns with an explanatory message when a legacy user-defined template was already migrated', async () => {
      const { logging, migrator } = createMigrator({
        ...SEED_SETTINGS,
        templates: [
          ...SEED.templates,
          {
            content: 'Already migrated',
            description: null,
            enabled: true,
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            migrations: { '1.2.9': { id: 'CUSTOM.00001', version: '2.0.0' } },
            predefined: false,
            shortcut: null,
            title: 'Already migrated',
          },
        ],
      });
      const { context } = createMigrationContext({
        legacyData: { local: { templates: [createLegacyTemplate({ key: 'CUSTOM.00001' })] } },
      });

      await migrator.migrate(context);

      expect(logging.logger.warn).toHaveBeenCalledWith('Skipping legacy user-defined template as already migrated', {
        legacy: expect.objectContaining({ key: 'CUSTOM.00001' }),
      });
    });

    it('transfers legacy toolbar options when the selected template exists and removes the legacy key', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            toolbar: { close: false, key: 'PREDEFINED.00002', options: false, popup: false },
          },
        },
      });

      const results = await migrator.migrate(context);

      expectOnlyPassed(results, 6);
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

    /*
     * 1.x had no context menu template of its own - a menu showing a single item ran whichever template the toolbar
     * button was set to - so the dedicated setting has to inherit that choice rather than default elsewhere.
     */
    it('transfers the legacy toolbar template to a context menu already set to template mode', async () => {
      const { migrator, target } = createMigrator({
        ...SEED,
        contextMenu: { ...SEED.contextMenu, mode: TemplateContextMenuMode.Template },
      });
      const { context } = createMigrationContext({
        legacyData: {
          local: {
            toolbar: { key: 'PREDEFINED.00002' },
          },
        },
      });

      await migrator.migrate(context);

      expect(getTargetData(target).contextMenu.templateId).toBe('PREDEFINED.00002');
    });

    it('leaves the context menu template alone when it is not set to template mode', async () => {
      const { migrator, target } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: {
          local: {
            toolbar: { key: 'PREDEFINED.00002' },
          },
        },
      });

      await migrator.migrate(context);

      expect(getTargetData(target).contextMenu.templateId).toBeNull();
    });

    it('transfers only the legacy options that are present for each remaining step', async () => {
      const { migrator, target } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: {
          local: {
            links: { target: true },
            markdown: {},
            menu: { paste: true },
            shortcuts: { paste: true },
            toolbar: { close: false },
          },
        },
      });

      await migrator.migrate(context);

      const data = getTargetData(target);

      expect(data.link).toEqual({ ...SEED.link, target: true });
      expect(data.markdown).toEqual(SEED.markdown);
      expect(data.contextMenu).toEqual({ ...SEED.contextMenu, autoPasteEnabled: true });
      expect(data.shortcuts).toEqual({ ...SEED.shortcuts, autoPasteEnabled: true });
      expect(data.action).toEqual({
        ...SEED.action,
        popup: { ...SEED.action.popup, autoCloseEnabled: false },
      });
    });

    it('tolerates a stored user-defined template that carries no migrations record', async () => {
      const { migrator, target } = createMigrator({
        ...SEED_SETTINGS,
        templates: [
          ...SEED.templates,
          {
            content: 'Hand written',
            description: null,
            enabled: true,
            id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            predefined: false,
            shortcut: null,
            title: 'Hand written',
          },
        ],
      });
      const { context } = createMigrationContext({
        legacyData: {
          local: {
            templates: [createLegacyTemplate({ key: 'CUSTOM.00001' })],
            toolbar: { key: 'CUSTOM.00001' },
          },
        },
      });

      await migrator.migrate(context);

      expect(getTargetData(target).action.templateId).toBe(TEMPLATE_ID);
    });

    it('selects popup mode when the legacy toolbar was in popup mode', async () => {
      const { migrator, target } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: { local: { toolbar: { popup: true } } },
      });

      await migrator.migrate(context);

      expect(getTargetData(target).action.mode).toBe(TemplateActionMode.Popup);
    });

    it('does not transfer a legacy toolbar template ID that has no matching template', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            toolbar: { close: false, key: 'CUSTOM.MISSING', options: false, popup: false },
          },
        },
      });

      await migrator.migrate(context);

      expect(getTargetData(target).action.templateId).toBe('PREDEFINED.00001');
      await expect(local.has('toolbar')).resolves.toBe(false);
    });

    it('fails the step and retains the legacy key when legacy toolbar options are malformed', async () => {
      const { migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({ legacyData: { local: { toolbar: false } } });

      const results = await migrator.migrate(context);

      expect(results[5]).toMatchObject({
        description: templateStepDescription(6),
        errors: [expect.objectContaining({ code: 'MIG422000' })],
        outcome: DataMigrationStepOutcome.Failed,
      });
      expect(getTargetData(target).action).toEqual(SEED.action);
      await expect(local.has('toolbar')).resolves.toBe(true);
    });

    // Regression guard for a fixed data-loss bug: `AbstractDataMigrator` used to run required steps concurrently
    // while every `TemplateDataMigrator` step mutates the same repository read-modify-write, so the last writer won
    // and every earlier step's changes were silently lost — unrecoverably, since each step then deletes its legacy
    // key. Steps now run sequentially, so every mutation must survive.
    it('merges every step mutation when several legacy keys are present', async () => {
      const { collectionTarget, migrator, target } = createMigrator();
      const {
        context,
        legacyData: { local },
      } = createMigrationContext({
        legacyData: {
          local: {
            links: { target: true, title: true },
            templates: [
              createLegacyTemplate({ key: 'CUSTOM.TOOLBAR', shortcut: 'C', title: 'Custom toolbar template' }),
            ],
            toolbar: { close: false, key: 'CUSTOM.TOOLBAR', options: false, popup: false },
          },
        },
      });

      const results = await migrator.migrate(context);

      expect(results).toEqual([
        { description: 'migrate_namespace_template_migration_step_1', outcome: DataMigrationStepOutcome.Passed },
        createNotRequiredStepResult('migrate_namespace_template_migration_step_2'),
        createNotRequiredStepResult('migrate_namespace_template_migration_step_3'),
        createNotRequiredStepResult('migrate_namespace_template_migration_step_4'),
        { description: 'migrate_namespace_template_migration_step_5', outcome: DataMigrationStepOutcome.Passed },
        { description: 'migrate_namespace_template_migration_step_6', outcome: DataMigrationStepOutcome.Passed },
      ]);
      expect(getTargetData(target)).toEqual({
        ...SEED_SETTINGS,
        action: {
          mode: TemplateActionMode.Template,
          popup: { autoCloseEnabled: false, optionLinkEnabled: false },
          // The toolbar step resolves the legacy key through the `migrations` record the templates step just wrote,
          // which is only possible because the steps run sequentially and share the same repository data
          templateId: TEMPLATE_ID,
        },
        link: { target: true, title: true },
      });
      expect(getTemplates(collectionTarget)).toEqual([
        {
          content: 'Custom content',
          description: null,
          enabled: true,
          id: TEMPLATE_ID,
          migrations: { '1.2.9': { id: 'CUSTOM.TOOLBAR', version: '2.0.0' } },
          predefined: false,
          shortcut: 'C',
          title: 'Custom toolbar template',
        },
        // Neither bundled template appeared in the legacy list, so both sort after the user's own template
        ...SEED.templates,
      ]);
      await expect(local.hasAny(['links', 'templates', 'toolbar'])).resolves.toBe(false);
    });

    it('runs steps sequentially rather than concurrently', async () => {
      const { migrator, target } = createMigrator();
      const { context } = createMigrationContext({
        legacyData: {
          local: {
            links: { target: true, title: true },
            markdown: { inline: true },
            shortcuts: { enabled: false },
          },
        },
      });

      await migrator.migrate(context);

      // Concurrent read-modify-write would leave only the last of these three
      expect(getTargetData(target)).toEqual({
        ...SEED_SETTINGS,
        link: { target: true, title: true },
        markdown: { inline: true },
        shortcuts: { ...SEED.shortcuts, enabled: false },
      });
    });
  });
});
