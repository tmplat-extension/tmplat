import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { type AnalyticsDataRepository } from 'extension/analytics/data/analytics-data.repository';
import { type AnalyticsData } from 'extension/analytics/data/analytics-data.schema';
import { AppearanceMode } from 'extension/common/appearance/appearance-mode.enum';
import { type AppearanceDataRepository } from 'extension/common/appearance/data/appearance-data.repository';
import { type AppearanceData } from 'extension/common/appearance/data/appearance-data.schema';
import { type LoggingDataRepository } from 'extension/common/logging/data/logging-data.repository';
import { type LoggingData } from 'extension/common/logging/data/logging-data.schema';
import { LogLevel } from 'extension/common/logging/log-level.enum';
import { type NotificationDataRepository } from 'extension/common/notification/data/notification-data.repository';
import { type NotificationData } from 'extension/common/notification/data/notification-data.schema';
import { type Settings } from 'extension/common/settings/settings.model';
import { SettingsService } from 'extension/common/settings/settings.service';
import { VersionSegment } from 'extension/common/version/version-segment.enum';
import { type OAuthDataRepository } from 'extension/oauth/data/oauth-data.repository';
import { type OAuthData } from 'extension/oauth/data/oauth-data.schema';
import { type TemplateDataRepository } from 'extension/template/data/template-data.repository';
import { type TemplateData } from 'extension/template/data/template-data.schema';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
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

const analyticsData = (overrides: Partial<AnalyticsData> = {}): AnalyticsData => ({
  clientId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  enabled: true,
  ...overrides,
});

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

const oauthData = (overrides: Partial<OAuthData> = {}): OAuthData => ({
  providers: { bitly: { accessToken: 'token', principal: 'user' } },
  ...overrides,
});

const templateData = (overrides: Partial<TemplateData> = {}): TemplateData => ({
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
  },
  link: { target: true, title: true },
  markdown: { inline: false },
  shortcuts: { autoPasteEnabled: false, enabled: true },
  templates: [{ enabled: true, id: 'predefined-1', predefined: true, shortcut: null }],
  ...overrides,
});

const urlShortenerData = (overrides: Partial<UrlShortenerData> = {}): UrlShortenerData => ({
  provider: UrlShortenerProviderName.DaGd,
  providers: {
    bitly: {},
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
  analytics: { enabled: false },
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
    },
    link: { target: false, title: false },
    markdown: { inline: true },
    shortcuts: { autoPasteEnabled: true, enabled: false },
  },
  logging: { enabled: true, level: LogLevel.Trace },
  notification: { changelog: { enabled: false, scope: VersionSegment.Major }, enabled: false },
  oauth: { providers: { bitly: { accessToken: 'new-token', principal: 'new-user' } } },
  urlShortener: {
    provider: UrlShortenerProviderName.Yourls,
    providers: {
      bitly: {},
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
  let analytics: FakeRepo<AnalyticsData>;
  let appearance: FakeRepo<AppearanceData>;
  let logging: FakeRepo<LoggingData>;
  let notification: FakeRepo<NotificationData>;
  let oauth: FakeRepo<OAuthData>;
  let template: FakeRepo<TemplateData>;
  let urlShortener: FakeRepo<UrlShortenerData>;
  let service: SettingsService;

  const build = () => {
    service = new SettingsService(
      analytics as unknown as AnalyticsDataRepository,
      appearance as unknown as AppearanceDataRepository,
      logging as unknown as LoggingDataRepository,
      notification as unknown as NotificationDataRepository,
      oauth as unknown as OAuthDataRepository,
      template as unknown as TemplateDataRepository,
      urlShortener as unknown as UrlShortenerDataRepository,
    );
  };

  beforeEach(() => {
    analytics = createFakeRepo(analyticsData());
    appearance = createFakeRepo(appearanceData());
    logging = createFakeRepo(loggingData());
    notification = createFakeRepo(notificationData());
    oauth = createFakeRepo(oauthData());
    template = createFakeRepo(templateData());
    urlShortener = createFakeRepo(urlShortenerData());
    build();
  });

  describe('getSettings', () => {
    it('aggregates only the user-configurable fields from each namespace', async () => {
      await expect(service.getSettings()).resolves.toEqual({
        analytics: { enabled: true },
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
          },
          link: { target: true, title: true },
          markdown: { inline: false },
          shortcuts: { autoPasteEnabled: false, enabled: true },
        },
        logging: { enabled: false, level: LogLevel.Warn },
        notification: { changelog: { enabled: true, scope: VersionSegment.Minor }, enabled: true },
        oauth: { providers: { bitly: { accessToken: 'token', principal: 'user' } } },
        urlShortener: {
          provider: UrlShortenerProviderName.DaGd,
          providers: urlShortenerData().providers,
        },
      });
    });

    it('excludes the analytics client id and the stored templates, which are managed separately', async () => {
      const result = await service.getSettings();

      expect(result.analytics).not.toHaveProperty('clientId');
      expect(result.general).not.toHaveProperty('templates');
    });

    it('returns a detached copy so mutating the result cannot corrupt a later read', async () => {
      const first = await service.getSettings();
      first.analytics.enabled = !first.analytics.enabled;

      await expect(service.getSettings()).resolves.toMatchObject({ analytics: { enabled: true } });
    });
  });

  describe('saveSettings', () => {
    it('persists the analytics enablement while preserving the client id', async () => {
      await service.saveSettings(settings());

      expect(analytics.snapshot()).toEqual({
        clientId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        enabled: false,
      });
    });

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
      expect(stored.templates).toEqual(templateData().templates);
    });

    it('persists the oauth providers', async () => {
      await service.saveSettings(settings());

      expect(oauth.snapshot()).toEqual({
        providers: { bitly: { accessToken: 'new-token', principal: 'new-user' } },
      });
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
                bitly: {},
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
                bitly: {},
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
});
