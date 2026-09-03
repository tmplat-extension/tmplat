/**
 * The minimum shape needed to resolve a template reference, so that the settings (which hold `TemplateDefinition`s),
 * the services (which hold `Template`s) and the options page all share one rule.
 */
export type TemplateReferenceCandidate = {
  readonly enabled: boolean;
  readonly id: string;
};

/**
 * Resolves the template a setting should point at, keeping `templateId` when it still names one of `templates` and
 * otherwise falling back to the first enabled template, then to the first of any kind.
 *
 * Both `action.templateId` and `contextMenu.templateId` are repaired with this whenever the templates they reference
 * change, and the options page applies it when a mode is switched to `Template`. That is what keeps "a mode that names
 * no template" out of storage: `null` is then only reachable when there is no template to point at.
 */
export const resolveTemplateId = (
  templates: readonly TemplateReferenceCandidate[],
  templateId: string | null | undefined,
): string | null => {
  if (templateId && templates.some((template) => template.id === templateId)) {
    return templateId;
  }

  return templates.find((template) => template.enabled)?.id ?? templates[0]?.id ?? null;
};
