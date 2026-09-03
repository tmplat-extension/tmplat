import { injectable } from 'extension/common/di';
import { type Content } from 'extension/content/content';

@injectable()
export class HomepageContent implements Content {
  inject() {
    document.documentElement.dataset.tmplatInstalled = 'true';
  }
}
