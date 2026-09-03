import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppearanceMode } from 'extension/common/appearance/appearance-mode.enum';
import { AppearanceService } from 'extension/common/appearance/appearance.service';
import { type AppearanceDataRepository } from 'extension/common/appearance/data/appearance-data.repository';
import {
  type AppearanceData,
  AppearanceDataSchema,
  DEFAULT_TEMPLATE_DATA_GRID_APPEARANCE,
} from 'extension/common/appearance/data/appearance-data.schema';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { RequiredDataRepository } from 'extension/common/data/data.repository';
import { ValidationService } from 'extension/common/validation/validation.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { createLoggingServiceMock } from 'extension/test/logger.mock';

// A minimal concrete repository so the service is exercised against a real repository (with genuine schema
// validation on mutate) backed by in-memory storage, rather than a hand-rolled stub.
class TestAppearanceRepository extends RequiredDataRepository<typeof AppearanceDataSchema, AppearanceData> {
  constructor(storage: FakeDataStorage) {
    super({
      dataStorage: storage,
      logger: createLoggingServiceMock().logger as never,
      namespace: DataNamespace.Appearance,
      schema: AppearanceDataSchema,
      validationService: new ValidationService(createLoggingServiceMock() as never),
    });
  }
}

type FakeMediaQuery = {
  addEventListener: ReturnType<typeof vi.fn>;
  matches: boolean;
  removeEventListener: ReturnType<typeof vi.fn>;
  trigger: () => void;
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('AppearanceService', () => {
  let mediaQuery: FakeMediaQuery;
  let service: AppearanceService;
  let storage: FakeDataStorage;

  const stubMatchMedia = (matches: boolean) => {
    const listeners = new Set<() => void>();
    mediaQuery = {
      addEventListener: vi.fn((_type: string, listener: () => void) => listeners.add(listener)),
      matches,
      removeEventListener: vi.fn((_type: string, listener: () => void) => listeners.delete(listener)),
      trigger: () => listeners.forEach((listener) => listener()),
    };
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mediaQuery),
    );
  };

  const givenStored = (data: AppearanceData) => {
    storage = new FakeDataStorage({ [DataNamespace.Appearance]: data });
    const repository = new TestAppearanceRepository(storage) as unknown as AppearanceDataRepository;
    service = new AppearanceService(repository);
  };

  beforeEach(() => {
    stubMatchMedia(false);
    givenStored({ mode: AppearanceMode.System });
  });

  describe('getMode', () => {
    it('returns the stored mode', async () => {
      givenStored({ mode: AppearanceMode.Dark });

      await expect(service.getMode()).resolves.toBe(AppearanceMode.Dark);
    });
  });

  describe('setMode', () => {
    it('persists the mode without discarding other stored appearance data', async () => {
      givenStored({ mode: AppearanceMode.System, templateDataGrid: { columnVisibilityModel: {}, pageSize: 50 } });

      await service.setMode(AppearanceMode.Light);

      expect(storage.snapshot()).toEqual({
        [DataNamespace.Appearance]: {
          mode: AppearanceMode.Light,
          templateDataGrid: { columnVisibilityModel: {}, pageSize: 50 },
        },
      });
    });
  });

  describe('getResolvedMode', () => {
    it.each([
      [AppearanceMode.Dark, 'dark'],
      [AppearanceMode.Light, 'light'],
    ])('resolves an explicit %s mode to %s without consulting the system preference', async (mode, expected) => {
      givenStored({ mode });

      await expect(service.getResolvedMode()).resolves.toBe(expected);
    });

    it.each([
      [true, 'dark'],
      [false, 'light'],
    ])('resolves the system mode against prefers-color-scheme: dark = %s', async (matches, expected) => {
      stubMatchMedia(matches);
      givenStored({ mode: AppearanceMode.System });

      await expect(service.getResolvedMode()).resolves.toBe(expected);
    });
  });

  describe('getTemplateDataGridState', () => {
    it('returns the stored data grid state when present', async () => {
      const templateDataGrid = { columnVisibilityModel: { name: false }, pageSize: 100 };
      givenStored({ mode: AppearanceMode.System, templateDataGrid });

      await expect(service.getTemplateDataGridState()).resolves.toEqual(templateDataGrid);
    });

    it('falls back to the default data grid state when none is stored', async () => {
      await expect(service.getTemplateDataGridState()).resolves.toEqual(DEFAULT_TEMPLATE_DATA_GRID_APPEARANCE);
    });
  });

  describe('setTemplateDataGridState', () => {
    it('persists the data grid state without discarding the mode', async () => {
      givenStored({ mode: AppearanceMode.Dark });

      const templateDataGrid = { columnVisibilityModel: { url: true }, pageSize: 25 };
      await service.setTemplateDataGridState(templateDataGrid);

      expect(storage.snapshot()).toEqual({
        [DataNamespace.Appearance]: { mode: AppearanceMode.Dark, templateDataGrid },
      });
    });
  });

  describe('addResolvedModeChangeListener', () => {
    it('notifies the listener when the system preference changes', async () => {
      givenStored({ mode: AppearanceMode.System });
      const listener = vi.fn();
      service.addResolvedModeChangeListener(listener);

      mediaQuery.matches = true;
      mediaQuery.trigger();
      await flush();

      expect(listener).toHaveBeenCalledWith('dark');
    });

    it('notifies the listener when the stored preference changes', async () => {
      givenStored({ mode: AppearanceMode.Light });
      const listener = vi.fn();
      service.addResolvedModeChangeListener(listener);

      await storage.set(DataNamespace.Appearance, { mode: AppearanceMode.Dark });
      storage.notifyChanges({
        [DataNamespace.Appearance]: {
          newValue: { mode: AppearanceMode.Dark },
          oldValue: { mode: AppearanceMode.Light },
        },
      });
      await flush();

      expect(listener).toHaveBeenCalledWith('dark');
    });

    it('stops observing the system preference once unsubscribed', async () => {
      const listener = vi.fn();
      const unsubscribe = service.addResolvedModeChangeListener(listener);

      unsubscribe();
      mediaQuery.trigger();
      await flush();

      expect(mediaQuery.removeEventListener).toHaveBeenCalled();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('applyToDocument', () => {
    it('applies the resolved colour scheme to the target immediately', async () => {
      givenStored({ mode: AppearanceMode.Dark });
      const target = { style: {} as CSSStyleDeclaration } as HTMLElement;

      service.applyToDocument(target);
      await flush();

      expect(target.style.colorScheme).toBe('dark');
    });

    it('keeps the target in sync as the system preference changes', async () => {
      givenStored({ mode: AppearanceMode.System });
      const target = { style: {} as CSSStyleDeclaration } as HTMLElement;

      service.applyToDocument(target);
      await flush();
      expect(target.style.colorScheme).toBe('light');

      mediaQuery.matches = true;
      mediaQuery.trigger();
      await flush();

      expect(target.style.colorScheme).toBe('dark');
    });
  });
});
