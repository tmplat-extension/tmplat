import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type DataInstallContext } from 'extension/common/data/data-install-context.model';
import { type DataUpdateContext } from 'extension/common/data/data-update-context.model';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { TemplateDataRepository } from 'extension/template/data/template-data.repository';
import { TemplateDataSchema } from 'extension/template/data/template-data.schema';
import { getPredefinedTemplates } from 'extension/template/predefined-templates';
import { asDataService, FakeDataService } from 'extension/test/data-service.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

const installContext = {} as DataInstallContext;
const updateContext = {} as DataUpdateContext;

describe('TemplateDataRepository', () => {
  let dataService: FakeDataService;
  let repository: TemplateDataRepository;

  beforeEach(() => {
    dataService = new FakeDataService();
    repository = new TemplateDataRepository(
      asDataService(dataService),
      createLoggingServiceMock() as unknown as LoggingService,
      new ValidationService(createLoggingServiceMock() as unknown as LoggingService),
    );
  });

  describe('install', () => {
    it('installs schema-valid default data seeded with every predefined template', async () => {
      const installed = await repository.install(installContext);

      expect(installed).toBe(true);
      const data = await repository.get();
      expect(TemplateDataSchema.safeParse(data).success).toBe(true);

      const predefinedIds = getPredefinedTemplates().map((template) => template.id);
      expect(data.templates.map((template) => template.id)).toEqual(expect.arrayContaining(predefinedIds));
      expect(data.templates.every((template) => template.predefined)).toBe(true);
    });

    it('points the default action at an enabled predefined template', async () => {
      await repository.install(installContext);

      const data = await repository.get();
      const actionTemplate = data.templates.find((template) => template.id === data.action.templateId);
      expect(actionTemplate?.enabled).toBe(true);
    });

    it('stores template data in sync storage', async () => {
      await repository.install(installContext);

      expect(await dataService.sync.getOptional('template')).toBeDefined();
      expect(await dataService.local.getOptional('template')).toBeUndefined();
    });

    it('does not overwrite existing data', async () => {
      await repository.install(installContext);
      const before = await repository.get();

      const installed = await repository.install(installContext);

      expect(installed).toBe(false);
      expect(await repository.get()).toEqual(before);
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
      await repository.mutate((data) => {
        data.templates = data.templates.filter((template) => template.id !== removedId);
        return data;
      });

      const changed = await repository.update(updateContext);

      expect(changed).toBe(true);
      const data = await repository.get();
      expect(data.templates.some((template) => template.id === removedId)).toBe(true);
    });

    it('reduces a stored predefined template to only the persisted properties', async () => {
      await repository.install(installContext);
      const predefinedId = getPredefinedTemplates()[0].id;
      await repository.mutate((data) => {
        const template = data.templates.find((t) => t.id === predefinedId) as Record<string, unknown>;
        // A predefined template must not retain user-defined fields such as content/title
        template.content = 'leaked content';
        template.title = 'leaked title';
        return data;
      });

      await repository.update(updateContext);

      const data = await repository.get();
      const template = data.templates.find((t) => t.id === predefinedId) as Record<string, unknown>;
      expect(template).not.toHaveProperty('content');
      expect(template).not.toHaveProperty('title');
    });

    it('preserves a user-defined template untouched', async () => {
      await repository.install(installContext);
      const userTemplate = {
        content: '{title}',
        description: null,
        enabled: true,
        id: 'user-1',
        predefined: false as const,
        shortcut: null,
        title: 'Mine',
      };
      await repository.mutate((data) => {
        data.templates.push(userTemplate);
        return data;
      });

      await repository.update(updateContext);

      const data = await repository.get();
      expect(data.templates.find((template) => template.id === 'user-1')).toEqual(userTemplate);
    });

    it('repairs a dangling action templateId', async () => {
      await repository.install(installContext);
      await repository.mutate((data) => {
        data.action.templateId = 'does-not-exist';
        return data;
      });

      const changed = await repository.update(updateContext);

      expect(changed).toBe(true);
      const data = await repository.get();
      expect(data.templates.some((template) => template.id === data.action.templateId)).toBe(true);
    });

    it('persists the repaired data through set', async () => {
      await repository.install(installContext);
      const setSpy = vi.spyOn(repository, 'set');
      await repository.mutate((data) => {
        data.templates = [];
        return data;
      });
      setSpy.mockClear();

      await repository.update(updateContext);

      expect(setSpy).toHaveBeenCalledTimes(1);
    });
  });
});
