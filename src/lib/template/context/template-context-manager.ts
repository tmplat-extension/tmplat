import { isString } from 'lodash-es';
import { DateTime } from 'luxon';

import { reduceToObject } from 'extension/common/array.utils';
import { DataService } from 'extension/common/data/data.service';
import { ExtensionInfo } from 'extension/common/extension-info';
import { IntlService } from 'extension/common/intl/intl.service';
import { getPathSegments } from 'extension/common/url.utils';
import { Tab, TabContext, TabContextDimension } from 'extension/tab/tab.model';
import { TabService } from 'extension/tab/tab.service';
import { templateContextEntriesDefinitions } from 'extension/template/context/entry';
import {
  TemplateContextCacheKey,
  TemplateContextCacheKeyBuilder,
  TemplateContextCacheKeyValue,
} from 'extension/template/context/template-context-cache-key';
import { TemplateContextData } from 'extension/template/context/template-context-data.model';
import { TemplateContextOptions } from 'extension/template/context/template-context-options.model';
import { TemplateContext } from 'extension/template/context/template-context.model';
import { buildOptions } from 'extension/template/context/template-context.utils';
import { Template } from 'extension/template/template.model';
import { UrlShortenerService } from 'extension/url-shortener/url-shortener.service';

export class TemplateContextManager {
  readonly context: TemplateContext;

  private readonly cache = new Map<string, any>();
  private readonly currentDateTime = DateTime.now();
  private readonly urlStack: URL[] = [];

  constructor(
    private readonly config: TemplateContextManagerConfig,
    private readonly dataService: DataService,
    private readonly extensionInfo: ExtensionInfo,
    private readonly intl: IntlService,
    private readonly tabService: TabService,
    private readonly urlShortenerService: UrlShortenerService,
  ) {
    this.context = reduceToObject(templateContextEntriesDefinitions, (definition) => [
      definition.name,
      definition.render(this),
    ]);
  }

  addCache<V = any>(key: TemplateContextCacheKey | TemplateContextCacheKeyBuilder, value: V): V {
    const cacheKey = TemplateContextManager.getCacheKey(key);

    this.cache.set(cacheKey, value);

    return value;
  }

  addCacheIfAbsent<V = any>(key: TemplateContextCacheKey | TemplateContextCacheKeyBuilder, value: V): V {
    const cacheKey = TemplateContextManager.getCacheKey(key);

    if (!this.cache.has(cacheKey)) {
      this.cache.set(cacheKey, value);
    }

    return value;
  }

  cacheKeyBuilder(...values: TemplateContextCacheKeyValue[]): TemplateContextCacheKeyBuilder {
    return new TemplateContextCacheKeyBuilder(...values);
  }

  async computeCacheIfAbsent<V = any>(
    key: TemplateContextCacheKey | TemplateContextCacheKeyBuilder,
    valueComputer: () => V | Promise<V>,
  ): Promise<V> {
    const cacheKey = TemplateContextManager.getCacheKey(key);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as V;
    }

    const value = await valueComputer();

    this.cache.set(cacheKey, value);

    return value;
  }

  createUrl(url: string): Promise<URL> {
    return this.computeCacheIfAbsent(
      TemplateContextManager.createInternalCacheKey('createUrl', url),
      () => new URL(url),
    );
  }

  createUrlSearchParams(search: string): Promise<URLSearchParams> {
    return this.computeCacheIfAbsent(
      TemplateContextManager.createInternalCacheKey('createUrlSearchParams', search),
      () => new URLSearchParams(search),
    );
  }

  getCache<V = any>(key: TemplateContextCacheKey | TemplateContextCacheKeyBuilder): V | undefined {
    const cacheKey = TemplateContextManager.getCacheKey(key);

    return this.cache.get(cacheKey);
  }

  getCurrentDateTime(): DateTime {
    return this.currentDateTime;
  }

  getCookies(url: string | URL): Promise<Readonly<Record<string, string>>> {
    return this.computeCacheIfAbsent(TemplateContextManager.createInternalCacheKey('getCookies', url), async () => {
      const cookies = await chrome.cookies.getAll({ url: url.toString() });

      return reduceToObject(cookies, (cookie) => [cookie.name, cookie.value]);
    });
  }

  getData(): Promise<TemplateContextData> {
    return this.computeCacheIfAbsent(TemplateContextManager.createInternalCacheKey('getData'), async () => {
      const allData = await Promise.all([this.dataService.local.all(), this.dataService.sync.all()]);

      return Object.assign({}, ...allData) as TemplateContextData;
    });
  }

  async getDataNamespace<N extends keyof TemplateContextData>(namespace: N): Promise<TemplateContextData[N]> {
    const data = await this.getData();

    return data[namespace];
  }

  getDimensionsFromTabContext(): Promise<TabContextDimension> {
    return this.computeCacheIfAbsent(
      TemplateContextManager.createInternalCacheKey('getDimensionsFromTabContext'),
      async () => {
        const { height, width } = this.config.tab;

        if (height != null && width != null) {
          return { height, width };
        }

        const { size } = await this.getTabContext();

        return size;
      },
    );
  }

  getExtensionInfo(): ExtensionInfo {
    return this.extensionInfo;
  }

  getKeywordsFromTabContext(): Promise<readonly string[]> {
    return this.computeCacheIfAbsent(
      TemplateContextManager.createInternalCacheKey('getKeywordsFromTabContext'),
      async () => {
        const { meta } = await this.getTabContext();
        const keywords = new Set(meta.keywords ? meta.keywords.split(/\s*,\s*/) : []);

        return [...keywords];
      },
    );
  }

  getLocale(): string {
    return this.intl.getLocale();
  }

  getOptions(): Promise<TemplateContextOptions> {
    return this.computeCacheIfAbsent(TemplateContextManager.createInternalCacheKey('getOptions'), async () =>
      buildOptions(await this.getData()),
    );
  }

  getSegments(path: string): Promise<readonly string[]> {
    return this.computeCacheIfAbsent(TemplateContextManager.createInternalCacheKey('getSegments', path), () =>
      getPathSegments(path),
    );
  }

  getShortUrl(url: string | URL): Promise<string> {
    return this.computeCacheIfAbsent(TemplateContextManager.createInternalCacheKey('getShortUrl', url), () =>
      this.urlShortenerService.shorten(url),
    );
  }

  getTab(): Tab {
    return this.config.tab;
  }

  getTabContext(): Promise<TabContext> {
    return this.computeCacheIfAbsent(TemplateContextManager.createInternalCacheKey('getTabContext'), () =>
      this.tabService.getTabContext(this.config.tab.id),
    );
  }

  getTemplate(): Template {
    return this.config.template;
  }

  getUrl(): URL {
    return this.urlStack.at(-1) || this.config.url;
  }

  isCached(key: TemplateContextCacheKey | TemplateContextCacheKeyBuilder): boolean {
    const cacheKey = TemplateContextManager.getCacheKey(key);

    return this.cache.has(cacheKey);
  }

  popUrl() {
    this.urlStack.pop();
  }

  async pushUrl(url: string | URL): Promise<void> {
    this.urlStack.push(isString(url) ? await this.createUrl(url) : url);
  }

  async render(text: string, render: (template: string) => Promise<string>): Promise<string> {
    return text && (await render(text));
  }

  async renderTrim(text: string, render: (template: string) => Promise<string>): Promise<string> {
    return text && (await render(text)).trim();
  }

  async renderTrimStart(text: string, render: (template: string) => Promise<string>): Promise<string> {
    return text && (await render(text)).trimStart();
  }

  async renderTrimEnd(text: string, render: (template: string) => Promise<string>): Promise<string> {
    return text && (await render(text)).trimEnd();
  }

  private static createInternalCacheKey<P extends keyof TemplateContextManager>(
    value: P,
    ...values: TemplateContextCacheKeyValue[]
  ): TemplateContextCacheKey {
    return new TemplateContextCacheKeyBuilder('TemplateContextManager', value, ...values).build();
  }

  private static getCacheKey(key: TemplateContextCacheKey | TemplateContextCacheKeyBuilder): TemplateContextCacheKey {
    return isString(key) ? key : key.build();
  }
}

export type TemplateContextManagerConfig = {
  readonly tab: Tab;
  readonly template: Template;
  readonly url: URL;
};
