import { beforeEach, describe, expect, it } from 'vitest';
import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataUpdateContext } from 'extension/common/data/data-update-context.model';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { TemplateCollectionRepository } from 'extension/template/data/template-collection.repository';
import { TemplateDefinitionSchema } from 'extension/template/data/template-data.schema';
import { getPredefinedTemplates } from 'extension/template/predefined-templates';
import { asDataService, FakeDataService } from 'extension/test/data-service.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const installContext = {} as DataInstallContext;
const updateContext = {} as DataUpdateContext;

const userTemplate = {
  content: '{title}',
  description: null,
  enabled: true,
  id: 'user-1',
  predefined: false as const,
  shortcut: null,
  title: 'Mine',
};

describe('TemplateCollectionRepository', () => {
  let dataService: FakeDataService;
  let repository: TemplateCollectionRepository;

  beforeEach(() => {
    dataService = new FakeDataService();
    repository = new TemplateCollectionRepository(
      asDataService(dataService),
      createLoggingServiceMock() as unknown as LoggingService,
      new ValidationService(createLoggingServiceMock() as unknown as LoggingService),
    );
  });

  describe('install', () => {
    it('installs schema-valid data seeded with every predefined template', async () => {
      const installed = await repository.install(installContext);

      expect(installed).toBe(true);
      const templates = await repository.getItems();
      expect(templates.every((template) => TemplateDefinitionSchema.safeParse(template).success)).toBe(true);

      const predefinedIds = getPredefinedTemplates().map((template) => template.id);
      expect(templates.map((template) => template.id)).toEqual(predefinedIds);
      expect(templates.every((template) => template.predefined)).toBe(true);
    });

    /*
     * The per-item split only buys anything if each template really is its own storage entry - a regression that put
     * them back in one array would still satisfy every behavioural assertion above.
     */
    it('stores each template under its own local key alongside an order index', async () => {
      await repository.install(installContext);

      const predefinedIds = getPredefinedTemplates().map((template) => template.id);
      await expect(dataService.local.get('template:index')).resolves.toEqual(predefinedIds);
      await expect(
        Promise.all(predefinedIds.map(async (id) => await dataService.local.getOptional(`template:item:${id}`))),
      ).resolves.toEqual(predefinedIds.map(() => expect.anything()));
      await expect(dataService.sync.getOptional('template:index')).resolves.toBeUndefined();
    });

    it('does not overwrite existing data', async () => {
      await repository.install(installContext);
      const before = await repository.getItems();

      const installed = await repository.install(installContext);

      expect(installed).toBe(false);
      await expect(repository.getItems()).resolves.toEqual(before);
    });
  });

  describe('update', () => {
    it('reports no change immediately after a fresh install', async () => {
      await repository.install(installContext);

      await expect(repository.update(updateContext)).resolves.toBe(false);
    });

    it('re-adds a predefined template that was removed from stored data', async () => {
      await repository.install(installContext);
      const removedId = getPredefinedTemplates()[0].id;
      await repository.removeItems([removedId]);

      const changed = await repository.update(updateContext);

      expect(changed).toBe(true);
      const templates = await repository.getItems();
      expect(templates.some((template) => template.id === removedId)).toBe(true);
    });

    it('reduces a stored predefined template to only the persisted properties', async () => {
      await repository.install(installContext);
      const predefinedId = getPredefinedTemplates()[0].id;
      // A predefined template must not retain user-defined fields such as content/title
      await repository.updateItem(predefinedId, (template) => ({
        ...template,
        content: 'leaked content',
        title: 'leaked title',
      }));

      await repository.update(updateContext);

      const template = (await repository.getItem(predefinedId)) as Record<string, unknown>;
      expect(template).not.toHaveProperty('content');
      expect(template).not.toHaveProperty('title');
    });

    it('preserves a user-defined template untouched', async () => {
      await repository.install(installContext);
      await repository.addItems([userTemplate]);

      await repository.update(updateContext);

      await expect(repository.getItem('user-1')).resolves.toEqual(userTemplate);
    });

    it('removes a stored predefined template this build no longer ships', async () => {
      await repository.install(installContext);
      await repository.addItems([{ enabled: true, id: 'PREDEFINED.GONE', predefined: true, shortcut: null }]);

      const changed = await repository.update(updateContext);

      expect(changed).toBe(true);
      await expect(repository.getItem('PREDEFINED.GONE')).resolves.toBeUndefined();
      await expect(repository.getItemIds()).resolves.not.toContain('PREDEFINED.GONE');
    });
  });

  describe('ordering', () => {
    it('returns items in the order named by the index rather than by key', async () => {
      await repository.addItems([userTemplate, { ...userTemplate, id: 'user-2' }, { ...userTemplate, id: 'user-3' }]);

      await repository.setItemOrder(['user-3', 'user-1', 'user-2']);

      await expect(repository.getItemIds()).resolves.toEqual(['user-3', 'user-1', 'user-2']);
    });

    /*
     * The index and the items are separate keys, so they can disagree - a write that failed part way through, or a
     * `1.x` migration interrupted mid-run. Existence is taken from the keys that are actually there, never from the
     * index, so an item the index forgot is still reachable.
     */
    it('appends an item the index does not mention', async () => {
      await repository.addItems([userTemplate, { ...userTemplate, id: 'user-2' }]);
      await dataService.local.set('template:index', ['user-1']);

      await expect(repository.getItemIds()).resolves.toEqual(['user-1', 'user-2']);
    });

    it('ignores an index entry naming an item that does not exist', async () => {
      await repository.addItems([userTemplate]);
      await dataService.local.set('template:index', ['ghost', 'user-1']);

      await expect(repository.getItemIds()).resolves.toEqual(['user-1']);
    });

    it('persists the reconciled order', async () => {
      await repository.addItems([userTemplate, { ...userTemplate, id: 'user-2' }]);
      await dataService.local.set('template:index', ['ghost', 'user-2']);

      await expect(repository.reconcile()).resolves.toBe(true);

      await expect(dataService.local.get('template:index')).resolves.toEqual(['user-2', 'user-1']);
      await expect(repository.reconcile()).resolves.toBe(false);
    });
  });

  describe('clear', () => {
    it('removes every item and the index', async () => {
      await repository.install(installContext);

      await repository.clear();

      await expect(repository.getItems()).resolves.toEqual([]);
      await expect(dataService.local.getOptional('template:index')).resolves.toBeUndefined();
      await expect(dataService.local.keys()).resolves.toEqual([]);
    });
  });
});
