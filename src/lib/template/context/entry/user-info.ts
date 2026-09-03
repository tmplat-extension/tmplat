import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/** The `user:password` (or just `user`) portion of the URL, without the trailing `@`. */
export const userInfo: TemplateContextEntryDefinition = {
  name: TemplateContextName.UserInfo,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_user_info_standard_description',
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url],
  render: (manager) => {
    return () => {
      const { password, username } = manager.getUrl();

      if (!username) {
        return '';
      }

      return password ? `${username}:${password}` : username;
    };
  },
};
