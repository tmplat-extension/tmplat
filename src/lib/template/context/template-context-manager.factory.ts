import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { GeolocationService, GeolocationServiceToken } from 'extension/common/geolocation/geolocation.service';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { MarkdownService, MarkdownServiceToken } from 'extension/common/markdown/markdown.service';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import {
  TemplateContextManager,
  TemplateContextManagerConfig,
} from 'extension/template/context/template-context-manager';
import { TemplateService, TemplateServiceToken } from 'extension/template/template.service';
import { UrlShortenerService, UrlShortenerServiceToken } from 'extension/url-shortener/url-shortener.service';

export const TemplateContextManagerFactoryToken = Symbol('TemplateContextManagerFactory');

@injectable()
export class TemplateContextManagerFactory {
  constructor(
    @inject(DataServiceToken) private readonly dataService: DataService,
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(GeolocationServiceToken) private readonly geolocationService: GeolocationService,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(MarkdownServiceToken) private readonly markdownService: MarkdownService,
    @inject(TabServiceToken) private readonly tabService: TabService,
    @inject(TemplateServiceToken) private readonly templateService: TemplateService,
    @inject(UrlShortenerServiceToken) private readonly urlShortenerService: UrlShortenerService,
  ) {}

  createTemplateContextManager(config: TemplateContextManagerConfig): TemplateContextManager {
    return new TemplateContextManager(
      config,
      this.dataService,
      this.extensionInfo,
      this.geolocationService,
      this.intl,
      this.markdownService,
      this.tabService,
      this.templateService,
      this.urlShortenerService,
    );
  }
}
