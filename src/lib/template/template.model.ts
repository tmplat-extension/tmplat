import {
  TemplateDataTemplatePredefined,
  TemplateDataTemplateUserDefined,
} from 'extension/template/data/template-data.model';
import { PredefinedTemplateProperties } from 'extension/template/predefined-templates';

/**
 * A template as consumed at runtime.
 *
 * Unlike what is persisted, a predefined template is hydrated with the properties resolved from the predefined
 * template dictionary, so that predefined and user-defined templates can be treated alike.
 */
export type Template = TemplatePredefined | TemplateUserDefined;

export type TemplatePredefined = Readonly<TemplateDataTemplatePredefined> & Readonly<PredefinedTemplateProperties>;

export type TemplateUserDefined = Readonly<TemplateDataTemplateUserDefined>;
