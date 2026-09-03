import { describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from 'extension/analytics/analytics.service';
import { AnalyticsDataRepository } from 'extension/analytics/data/analytics-data.repository';
import { type AnalyticsData } from 'extension/analytics/data/analytics-data.schema';
import { DataNamespace } from 'extension/common/data/data-namespace.enum';
import { type DataService } from 'extension/common/data/data.service';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { ValidationService } from 'extension/common/validation/validation.service';
import { FakeDataStorage } from 'extension/test/data-storage.fake';
import { installFetchMock } from 'extension/test/fetch.mock';
import { createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';

const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const ACCOUNT_ID = 'UA-28812528-1';

const okResponse = () => new Response(null, { status: 200 });

describe('AnalyticsService', () => {
  let logging: LoggingServiceMock;
  let storage: FakeDataStorage;

  const createService = (data: AnalyticsData = { clientId: CLIENT_ID, enabled: true }) => {
    logging = createLoggingServiceMock();
    storage = new FakeDataStorage({ [DataNamespace.Analytics]: data });
    const dataService = { sync: storage } as unknown as DataService;
    const repository = new AnalyticsDataRepository(
      dataService,
      createLoggingServiceMock() as unknown as LoggingService,
      new ValidationService(createLoggingServiceMock() as never),
    );

    return new AnalyticsService(repository, logging as unknown as LoggingService);
  };

  describe('trackEvent', () => {
    it('sends a well-formed event hit when analytics is enabled', async () => {
      const service = createService();
      const fetch = installFetchMock();
      fetch.mockResolvedValue(okResponse());

      await service.trackEvent({ category: 'ui', action: 'click', label: 'button', value: 3 });

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = fetch.mock.calls[0];
      expect(init).toMatchObject({ method: 'POST' });
      const params = new URL(String(url)).searchParams;
      expect(Object.fromEntries(params)).toEqual({
        v: '1',
        tid: ACCOUNT_ID,
        cid: CLIENT_ID,
        t: 'event',
        ec: 'ui',
        ea: 'click',
        el: 'button',
        ev: '3',
      });
    });

    it('omits optional label and value when they are not supplied', async () => {
      const service = createService();
      const fetch = installFetchMock();
      fetch.mockResolvedValue(okResponse());

      await service.trackEvent({ category: 'ui', action: 'open' });

      const params = new URL(String(fetch.mock.calls[0][0])).searchParams;
      expect(params.has('el')).toBe(false);
      expect(params.has('ev')).toBe(false);
    });

    it('does not send anything when analytics is disabled', async () => {
      const service = createService({ clientId: CLIENT_ID, enabled: false });
      const fetch = installFetchMock();

      await service.trackEvent({ category: 'ui', action: 'click' });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('logs and throws ANA500000 when the collect endpoint responds with an error', async () => {
      const service = createService();
      const fetch = installFetchMock();
      fetch.mockResolvedValue(new Response(null, { status: 500 }));

      await expect(service.trackEvent({ category: 'ui', action: 'click' })).rejects.toMatchObject({
        code: 'ANA500000',
      });
      expect(logging.logger.error).toHaveBeenCalled();
    });
  });

  describe('trackPageView', () => {
    it('sends a page view hit derived from the document location and title', async () => {
      const service = createService();
      const fetch = installFetchMock();
      fetch.mockResolvedValue(okResponse());
      vi.stubGlobal('document', { documentURI: 'https://app.test/settings?tab=1', title: 'Settings' });

      await service.trackPageView();

      const params = new URL(String(fetch.mock.calls[0][0])).searchParams;
      expect(Object.fromEntries(params)).toMatchObject({
        t: 'pageview',
        dh: 'https://app.test',
        dp: '/settings',
        dt: 'Settings',
      });
    });

    // Regression: `trackPageView` reads `document.documentURI` and constructs a `URL` *before* its first await, so
    // until it was declared `async` a malformed URI (or a context with no `document`) threw synchronously out of a
    // promise-returning method, bypassing a caller's `.catch(...)`.
    it('rejects rather than throwing synchronously when the document URI is unusable', async () => {
      const service = createService();
      installFetchMock().mockResolvedValue(okResponse());
      vi.stubGlobal('document', { documentURI: 'not-a-valid-url', title: 'Broken' });
      let promise!: Promise<void>;

      expect(() => {
        promise = service.trackPageView();
      }).not.toThrow();
      await expect(promise).rejects.toThrow();
    });
  });

  describe('isAnalyticsEnabled', () => {
    it.each([[true], [false]])('reflects the stored enabled flag (%s)', async (enabled) => {
      const service = createService({ clientId: CLIENT_ID, enabled });

      await expect(service.isAnalyticsEnabled()).resolves.toBe(enabled);
    });
  });

  describe('setAnalyticsEnabled', () => {
    it('persists the new enabled flag without altering the client id', async () => {
      const service = createService({ clientId: CLIENT_ID, enabled: false });

      await service.setAnalyticsEnabled(true);

      expect(storage.snapshot()).toEqual({ [DataNamespace.Analytics]: { clientId: CLIENT_ID, enabled: true } });
    });
  });
});
