import { inject, injectable } from 'extension/common/di';
import { ExtensionInfo, ExtensionInfoToken } from 'extension/common/extension-info';
import { Content } from 'extension/content/content';

@injectable()
export class HomepageContent implements Content {
  constructor(@inject(ExtensionInfoToken) private readonly extensionInfo: ExtensionInfo) {}

  inject() {
    const id = this.extensionInfo.currentId;
    const newClasses = ['disabled'];
    const oldClasses = ['chrome_install_button'];

    document.querySelectorAll(`a.${oldClasses[0]}[href\$=${id}]`).forEach((link) => {
      link.innerHTML = link.innerHTML.replace('Install', 'Installed');
      newClasses.forEach((className) => link.classList.add(className));
      oldClasses.forEach((className) => link.classList.remove(className));
    });
  }
}
