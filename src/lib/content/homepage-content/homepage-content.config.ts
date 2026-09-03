import { Container } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { ContentToken } from 'extension/content/content';
import { HomepageContent } from 'extension/content/homepage-content/homepage-content';

const container = new Container({
  defaultScope: 'Singleton',
  jitless: true,
});
container.bind(ContentToken).to(HomepageContent);
container.bind(ExtensionInfoToken).to(ExtensionInfo);

export { container };
