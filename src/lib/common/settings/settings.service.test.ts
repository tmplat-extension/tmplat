import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { AppearanceMode } from 'extension/common/appearance/appearance-mode.enum';
import { type AppearanceDataRepository } from 'extension/common/appearance/data/appearance-data.repository';
import { type AppearanceData } from 'extension/common/appearance/data/appearance-data.schema';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type LoggingDataRepository } from 'extension/common/logging/data/logging-data.repository';
import { type LoggingData } from 'extension/common/logging/data/logging-data.schema';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { type NotificationDataRepository } from 'extension/common/notification/data/notification-data.repository';
import { type NotificationData } from 'extension/common/notification/data/notification-data.schema';
import { type Settings } from 'extension/common/settings/settings.model';
import { SettingsService } from 'extension/common/settings/settings.service';
import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { type TemplateDataRepository } from 'extension/template/data/template-data.repository';
import { type TemplateSettings } from 'extension/template/data/template-data.schema';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';
import { type UrlShortenerDataRepository } from 'extension/url-shortener/data/url-shortener-data.repository';
import { type UrlShortenerData, UrlShortenerDataSchema } from 'extension/url-shortener/data/url-shortener-data.schema';
import { UrlShortenerProviderName } from 'extension/url-shortener/provider/url-shortener-provider-name.enum';
import { YourlsAuthenticationMode } from 'extension/url-shortener/provider/yourls-authentication-mode.enum';

type FakeRepo<T> = {
  get: Mock<() => Promise<T>>;
  mutate: Mock<(mutator: (data: T) => T | Promise<T>) => Promise<void>>;
  snapshot: () => T;
};

// SettingsService only ever calls `get()` and `mutate()` on each repository, so a lightweight fake that records the
// result of the mutator is all that is needed to assert on the transformation it performs. Constructing seven real
// repositories (each with its own DI-registered subclass and seed data) would add significant boilerplate without
// exercising any more of SettingsService's own logic. Where the schema-validity of the saved data genuinely matters
// (the YOURLS normalization), the persisted result is additionally validated against the real schema below.
const createFakeRepo = <T>(initial: T): FakeRepo<T> => {
  let current = structuredClone(initial);
  return {
    get: vi.fn(async () => structuredClone(current)),
    mutate: vi.fn(async (mutator) => {
      current = await mutator(structuredClone(current));
    }),
    snapshot: () => structuredClone(current),
  };
};

const appearanceData = (overrides: Partial<AppearanceData> = {}): AppearanceData => ({
  mode: AppearanceMode.System,
  ...overrides,
});

const loggingData = (overrides: Partial<LoggingData> = {}): LoggingData => ({
  enabled: false,
  level: LogLevel.Warn,
  ...overrides,
});

const notificationData = (overrides: Partial<NotificationData> = {}): NotificationData => ({
  changelog: { enabled: true, scope: VersionSegment.Minor },
  enabled: true,
  ...overrides,
});

const templateData = (overrides: Partial<TemplateSettings> = {}): TemplateSettings => ({
  action: {
    mode: TemplateActionMode.Popup,
    popup: { autoCloseEnabled: true, optionLinkEnabled: true },
    templateId: null,
  },
  contextMenu: {
    autoPasteEnabled: false,
    enabled: true,
    mode: TemplateContextMenuMode.Menu,
    optionLinkEnabled: true,
    templateId: null,
  },
  link: { target: true, title: true },
  markdown: { inline: false },
  shortcuts: { autoPasteEnabled: false, enabled: true },
  ...overrides,
});

const urlShortenerData = (overrides: Partial<UrlShortenerData> = {}): UrlShortenerData => ({
  provider: UrlShortenerProviderName.DaGd,
  providers: {
    dagd: {},
    spoome: {},
    yourls: {
      authenticationMode: null,
      password: null,
      signature: null,
      url: null,
      username: null,
    },
  },
  ...overrides,
});

const settings = (overrides: Partial<Settings> = {}): Settings => ({
  appearance: { mode: AppearanceMode.Dark },
  general: {
    action: {
      mode: TemplateActionMode.Template,
      popup: { autoCloseEnabled: false, optionLinkEnabled: false },
      templateId: 'template-1',
    },
    contextMenu: {
      autoPasteEnabled: true,
      enabled: false,
      mode: TemplateContextMenuMode.Template,
      optionLinkEnabled: false,
      templateId: null,
    },
    link: { target: false, title: false },
    markdown: { inline: true },
    shortcuts: { autoPasteEnabled: true, enabled: false },
  },
  logging: { enabled: true, level: LogLevel.Trace },
  notification: { changelog: { enabled: false, scope: VersionSegment.Major }, enabled: false },
  urlShortener: {
    provider: UrlShortenerProviderName.Yourls,
    providers: {
      dagd: {},
      spoome: {},
      yourls: {
        authenticationMode: YourlsAuthenticationMode.Basic,
        password: 'secret',
        signature: null,
        url: 'https://yourls.example.com/api',
        username: 'admin',
      },
    },
  },
  ...overrides,
});

describe('SettingsService', () => {
  let appearance: FakeRepo<AppearanceData>;
  let logging: FakeRepo<LoggingData>;
  let notification: FakeRepo<NotificationData>;
  let template: FakeRepo<TemplateSettings>;
  let urlShortener: FakeRepo<UrlShortenerData>;
  let loggingService: LoggingServiceMock;
  let service: SettingsService;

  const build = () => {
    service = new SettingsService(
      appearance as unknown as AppearanceDataRepository,
      loggingService as unknown as LoggingService,
      logging as unknown as LoggingDataRepository,
      notification as unknown as NotificationDataRepository,
      template as unknown as TemplateDataRepository,
      urlShortener as unknown as UrlShortenerDataRepository,
    );
  };

  beforeEach(() => {
    loggingService = createLoggingServiceMock();
    appearance = createFakeRepo(appearanceData());
    logging = createFakeRepo(loggingData());
    notification = createFakeRepo(notificationData());
    template = createFakeRepo(templateData());
    urlShortener = createFakeRepo(urlShortenerData());
    build();
  });

  describe('getSettings', () => {
    it('aggregates only the user-configurable fields from each namespace', async () => {
      await expect(service.getSettings()).resolves.toEqual({
        appearance: { mode: AppearanceMode.System },
        general: {
          action: {
            mode: TemplateActionMode.Popup,
            popup: { autoCloseEnabled: true, optionLinkEnabled: true },
            templateId: null,
          },
          contextMenu: {
            autoPasteEnabled: false,
            enabled: true,
            mode: TemplateContextMenuMode.Menu,
            optionLinkEnabled: true,
            templateId: null,
          },
          link: { target: true, title: true },
          markdown: { inline: false },
          shortcuts: { autoPasteEnabled: false, enabled: true },
        },
        logging: { enabled: false, level: LogLevel.Warn },
        notification: { changelog: { enabled: true, scope: VersionSegment.Minor }, enabled: true },
        urlShortener: {
          provider: UrlShortenerProviderName.DaGd,
          providers: urlShortenerData().providers,
        },
      });
    });

    it('excludes the stored templates, which are managed separately', async () => {
      const result = await service.getSettings();

      expect(result.general).not.toHaveProperty('templates');
    });

    it('returns a detached copy so mutating the result cannot corrupt a later read', async () => {
      const first = await service.getSettings();
      first.appearance.mode = AppearanceMode.Dark;

      await expect(service.getSettings()).resolves.toMatchObject({ appearance: { mode: AppearanceMode.System } });
    });
  });

  describe('saveSettings', () => {
    it('persists the appearance, logging and notification settings', async () => {
      await service.saveSettings(settings());

      expect(appearance.snapshot()).toEqual({ mode: AppearanceMode.Dark });
      expect(logging.snapshot()).toEqual({ enabled: true, level: LogLevel.Trace });
      expect(notification.snapshot()).toEqual({
        changelog: { enabled: false, scope: VersionSegment.Major },
        enabled: false,
      });
    });

    it('persists the general template settings while preserving the stored templates', async () => {
      await service.saveSettings(settings());

      const stored = template.snapshot();

      expect(stored.action).toEqual({
        mode: TemplateActionMode.Template,
        popup: { autoCloseEnabled: false, optionLinkEnabled: false },
        templateId: 'template-1',
      });
      expect(stored.markdown).toEqual({ inline: true });
    });

    describe('url shortener', () => {
      it('persists the selected provider', async () => {
        await service.saveSettings(settings());

        expect(urlShortener.snapshot().provider).toBe(UrlShortenerProviderName.Yourls);
      });

      it('trims YOURLS credentials and coalesces blank values to null', async () => {
        await service.saveSettings(
          settings({
            urlShortener: {
              provider: UrlShortenerProviderName.Yourls,
              providers: {
                dagd: {},
                spoome: {},
                yourls: {
                  authenticationMode: YourlsAuthenticationMode.Basic,
                  password: '   ',
                  signature: '',
                  url: '  https://yourls.example.com/api  ',
                  username: '  admin  ',
                },
              },
            },
          }),
        );

        expect(urlShortener.snapshot().providers.yourls).toEqual({
          authenticationMode: YourlsAuthenticationMode.Basic,
          password: null,
          signature: null,
          url: 'https://yourls.example.com/api',
          username: 'admin',
        });
      });

      it('produces YOURLS data that is valid against the real schema after normalization', async () => {
        await service.saveSettings(
          settings({
            urlShortener: {
              provider: UrlShortenerProviderName.Yourls,
              providers: {
                dagd: {},
                spoome: {},
                yourls: {
                  authenticationMode: null,
                  password: '   ',
                  signature: '   ',
                  url: '   ',
                  username: '   ',
                },
              },
            },
          }),
        );

        expect(UrlShortenerDataSchema.safeParse(urlShortener.snapshot()).success).toBe(true);
      });
    });

    it('operates on a copy of the incoming settings, so mutating them afterwards has no effect', async () => {
      const input = settings();

      await service.saveSettings(input);
      input.logging.enabled = false;
      input.general.markdown.inline = false;

      expect(logging.snapshot()).toEqual({ enabled: true, level: LogLevel.Trace });
      expect(template.snapshot().markdown).toEqual({ inline: true });
    });
  });
  // The options UI passes these rejections straight to `useErrorDetail`, which can only render a specific message
  // for an `ExtensionError` and otherwise shows a generic "something went wrong". `allFulfilled` defaults to
  // reducing every reason into an `AggregateError`, which would silently degrade every settings failure into that
  // generic message, so both paths pass an explicit `firstError` reducer.
  describe('error reporting', () => {
    it('rejects getSettings with the underlying error rather than an AggregateError', async () => {
      const cause = ExtensionError.from('DAT404000', 'templates');
      template.get.mockRejectedValue(cause);

      await expect(service.getSettings()).rejects.toBe(cause);
    });

    it('rejects saveSettings with the underlying error rather than an AggregateError', async () => {
      const cause = ExtensionError.from('DAT404000', 'templates');
      template.mutate.mockRejectedValue(cause);

      await expect(service.saveSettings(settings())).rejects.toBe(cause);
    });

    it('logs every reason when more than one namespace fails, so the discarded ones are not lost', async () => {
      const first = ExtensionError.from('DAT404000', 'appearance');
      const second = ExtensionError.from('DAT404000', 'templates');
      appearance.get.mockRejectedValue(first);
      template.get.mockRejectedValue(second);

      await expect(service.getSettings()).rejects.toBe(first);
      expect(loggingService.logger.error).toHaveBeenCalledWith('Failed to read one or more settings namespaces', {
        reasons: [first, second],
      });
    });
  });
});
