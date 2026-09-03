import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/** The original, unmodified URL of the page (equivalent to `url`, kept for parity with the legacy `purl.js` name). */
export const source: TemplateContextEntryDefinition = {
  name: TemplateContextName.Source,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Standard]: {
      descriptionKey: 'context_source_standard_description',
      dataType: TemplateContextDataType.String,
    },
  },
  features: [TemplateContextFeature.Url],
  render: (manager) => {
    return () => manager.getUrl().href;
  },
};
