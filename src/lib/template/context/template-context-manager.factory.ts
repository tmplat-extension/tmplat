import { DataService, DataServiceToken } from 'extension/common/data/data.service';
import { inject, injectable } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { IntlService, IntlServiceToken } from 'extension/common/intl/intl.service';
import { TabService, TabServiceToken } from 'extension/tab/tab.service';
import {
  TemplateContextManager,
  TemplateContextManagerConfig,
} from 'extension/template/context/template-context-manager';
import { UrlShortenerService, UrlShortenerServiceToken } from 'extension/url-shortener/url-shortener.service';

export const TemplateContextManagerFactoryToken = Symbol('TemplateContextManagerFactory');

@injectable()
export class TemplateContextManagerFactory {
  constructor(
    @inject(DataServiceToken) private readonly dataService: DataService,
    @inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo,
    @inject(IntlServiceToken) private readonly intl: IntlService,
    @inject(TabServiceToken) private readonly tabService: TabService,
    @inject(UrlShortenerServiceToken) private readonly urlShortenerService: UrlShortenerService,
  ) {}

  createTemplateContextManager(config: TemplateContextManagerConfig): TemplateContextManager {
    return new TemplateContextManager(
      config,
      this.dataService,
      this.extensionInfo,
      this.intl,
      this.tabService,
      this.urlShortenerService,
    );
  }
}
