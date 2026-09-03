import { ExtensionVersion } from 'extension/common/extension-version.enum';
import { TemplateContextCategory } from 'extension/template/context/template-context-category.enum';
import { TemplateContextDataType } from 'extension/template/context/template-context-data-type.enum';
import { TemplateContextFeature } from 'extension/template/context/template-context-feature.enum';
import { TemplateContextName } from 'extension/template/context/template-context-name.enum';
import { TemplateContextEntryDefinition } from 'extension/template/context/template-context.model';

/**
 * The geolocation coordinates of the client, if a location could be determined, otherwise `null`.
 *
 * The location is read using the extension's own `geolocation` permission (via the offscreen document) instead of the
 * page's, so it is neither subject to a prompt within the page nor blocked by the page's permissions policy.
 */
export const coords: TemplateContextEntryDefinition = {
  name: TemplateContextName.Coords,
  added: ExtensionVersion.V2_0_0,
  categories: {
    [TemplateContextCategory.Collection]: {
      descriptionKey: 'context_coords_collection_description',
      dataType: TemplateContextDataType.Object,
      valueDataType: TemplateContextDataType.Number,
    },
  },
  features: [TemplateContextFeature.Geolocation],
  render: (manager) => {
    return async () => (await manager.getCoords()) ?? null;
  },
};
