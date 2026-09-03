import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { type SettingsGeneral } from 'extension/common/settings/settings.model';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { type Template } from 'extension/template/template.model';
import { resolveTemplateId } from 'extension/template/template.utils';
import { useTemplates } from 'extension/template/templates.context';
import { useErrorDetail } from 'extension/ui/common/hooks/use-error-detail';
import { type SettingsPageProps } from 'extension/ui/options/component/settings-dialog/settings-page.model';
import { SettingsSection } from 'extension/ui/options/component/settings-section/settings-section';
import { SettingsSwitch } from 'extension/ui/options/component/settings-switch/settings-switch';

/**
 * A template field shared by the toolbar button and context menu, both of which name a single template to run.
 *
 * Disabled templates are listed but cannot be selected, so that an existing selection still shows the title the user
 * recognises rather than appearing blank once they turn that template off.
 */
function TemplateField({ disabled, error, helperText, label, onChange, templates, value }: TemplateFieldProps) {
  const intl = useIntl();
  const templateService = useTemplates();

  return (
    <TextField
      select
      fullWidth
      label={label}
      value={templates.some((template) => template.id === value) ? value : ''}
      error={!!error}
      helperText={error ?? helperText}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {templates.map((template) => (
        <MenuItem key={template.id} value={template.id} disabled={!template.enabled}>
          {templateService.getTemplateTitle(template)}
          {!template.enabled && ` (${intl.getMessage('settings_general_template_option_disabled_label')})`}
        </MenuItem>
      ))}
    </TextField>
  );
}

type TemplateFieldProps = {
  readonly disabled: boolean;
  readonly error: string | undefined;
  readonly helperText: string;
  readonly label: string;
  readonly onChange: (templateId: string) => void;
  readonly templates: readonly Template[];
  readonly value: string | null;
};

export function GeneralSettings({ onChange, settings }: SettingsPageProps<SettingsGeneral>) {
  const getErrorDetail = useErrorDetail();
  const intl = useIntl();
  const templateService = useTemplates();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(undefined);

      try {
        const result = await templateService.getTemplates();

        if (!cancelled) {
          setTemplates(result);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getErrorDetail(e).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getErrorDetail, templateService]);

  const isPopupMode = settings.action.mode === TemplateActionMode.Popup;

  return (
    <>
      <SettingsSection
        title={intl.getMessage('settings_general_toolbar_button_title')}
        description={intl.getMessage('settings_general_toolbar_button_description')}
      >
        <FormControl disabled={loading}>
          <RadioGroup
            value={settings.action.mode}
            onChange={(event) => {
              const mode = event.target.value as TemplateActionMode;

              onChange({
                ...settings,
                action: {
                  ...settings.action,
                  mode,
                  templateId:
                    mode === TemplateActionMode.Template
                      ? resolveTemplateId(templates, settings.action.templateId)
                      : settings.action.templateId,
                },
              });
            }}
          >
            <FormControlLabel
              value={TemplateActionMode.Popup}
              control={<Radio />}
              label={intl.getMessage('settings_general_toolbar_button_popup_label')}
            />
            <FormControlLabel
              value={TemplateActionMode.Template}
              control={<Radio />}
              label={intl.getMessage('settings_general_toolbar_button_template_label')}
            />
          </RadioGroup>
        </FormControl>
        {isPopupMode ? (
          <>
            <SettingsSwitch
              checked={settings.action.popup.autoCloseEnabled}
              onChange={(event) =>
                onChange({
                  ...settings,
                  action: {
                    ...settings.action,
                    popup: { ...settings.action.popup, autoCloseEnabled: event.target.checked },
                  },
                })
              }
              label={intl.getMessage('settings_general_toolbar_button_auto_close_label')}
            />
            <SettingsSwitch
              checked={settings.action.popup.optionLinkEnabled}
              onChange={(event) =>
                onChange({
                  ...settings,
                  action: {
                    ...settings.action,
                    popup: { ...settings.action.popup, optionLinkEnabled: event.target.checked },
                  },
                })
              }
              label={intl.getMessage('settings_general_toolbar_button_option_link_label')}
            />
          </>
        ) : (
          <TemplateField
            label={intl.getMessage('settings_general_toolbar_button_template_field_label')}
            helperText={intl.getMessage('settings_general_toolbar_button_template_field_helper_text')}
            error={error}
            disabled={loading}
            templates={templates}
            value={settings.action.templateId}
            onChange={(templateId) =>
              onChange({
                ...settings,
                action: { ...settings.action, templateId },
              })
            }
          />
        )}
      </SettingsSection>

      <SettingsSection
        title={intl.getMessage('settings_general_context_menu_title')}
        description={intl.getMessage('settings_general_context_menu_description')}
      >
        <SettingsSwitch
          checked={settings.contextMenu.enabled}
          onChange={(event) =>
            onChange({
              ...settings,
              contextMenu: { ...settings.contextMenu, enabled: event.target.checked },
            })
          }
          label={intl.getMessage('settings_general_context_menu_enabled_label')}
        />
        <FormControl disabled={loading || !settings.contextMenu.enabled}>
          <FormLabel>{intl.getMessage('settings_general_context_menu_behaviour_label')}</FormLabel>
          <RadioGroup
            value={settings.contextMenu.mode}
            onChange={(event) => {
              const mode = event.target.value as TemplateContextMenuMode;

              onChange({
                ...settings,
                contextMenu: {
                  ...settings.contextMenu,
                  mode,
                  templateId:
                    mode === TemplateContextMenuMode.Template
                      ? resolveTemplateId(templates, settings.contextMenu.templateId)
                      : settings.contextMenu.templateId,
                },
              });
            }}
          >
            <FormControlLabel
              value={TemplateContextMenuMode.Menu}
              control={<Radio />}
              label={intl.getMessage('settings_general_context_menu_mode_menu_label')}
            />
            <FormControlLabel
              value={TemplateContextMenuMode.Template}
              control={<Radio />}
              label={intl.getMessage('settings_general_context_menu_mode_template_label')}
            />
          </RadioGroup>
        </FormControl>
        {settings.contextMenu.mode === TemplateContextMenuMode.Template && (
          <TemplateField
            label={intl.getMessage('settings_general_context_menu_template_field_label')}
            helperText={intl.getMessage('settings_general_context_menu_template_field_helper_text')}
            error={error}
            disabled={loading || !settings.contextMenu.enabled}
            templates={templates}
            value={settings.contextMenu.templateId}
            onChange={(templateId) =>
              onChange({
                ...settings,
                contextMenu: { ...settings.contextMenu, templateId },
              })
            }
          />
        )}
        <SettingsSwitch
          checked={settings.contextMenu.optionLinkEnabled}
          disabled={!settings.contextMenu.enabled}
          onChange={(event) =>
            onChange({
              ...settings,
              contextMenu: { ...settings.contextMenu, optionLinkEnabled: event.target.checked },
            })
          }
          label={intl.getMessage('settings_general_context_menu_option_link_label')}
        />
        <SettingsSwitch
          checked={settings.contextMenu.autoPasteEnabled}
          disabled={!settings.contextMenu.enabled}
          onChange={(event) =>
            onChange({
              ...settings,
              contextMenu: { ...settings.contextMenu, autoPasteEnabled: event.target.checked },
            })
          }
          label={intl.getMessage('settings_general_auto_paste_label')}
          helperText={intl.getMessage('settings_general_auto_paste_helper_text')}
        />
      </SettingsSection>

      <SettingsSection
        title={intl.getMessage('settings_general_shortcuts_title')}
        description={intl.getMessage('settings_general_shortcuts_description')}
      >
        <SettingsSwitch
          checked={settings.shortcuts.enabled}
          onChange={(event) =>
            onChange({
              ...settings,
              shortcuts: { ...settings.shortcuts, enabled: event.target.checked },
            })
          }
          label={intl.getMessage('settings_general_shortcuts_enabled_label')}
        />
        <SettingsSwitch
          checked={settings.shortcuts.autoPasteEnabled}
          disabled={!settings.shortcuts.enabled}
          onChange={(event) =>
            onChange({
              ...settings,
              shortcuts: { ...settings.shortcuts, autoPasteEnabled: event.target.checked },
            })
          }
          label={intl.getMessage('settings_general_auto_paste_label')}
          helperText={intl.getMessage('settings_general_auto_paste_helper_text')}
        />
      </SettingsSection>

      <SettingsSection
        title={intl.getMessage('settings_general_links_title')}
        description={intl.getMessage('settings_general_links_description')}
      >
        <SettingsSwitch
          checked={settings.link.title}
          onChange={(event) =>
            onChange({
              ...settings,
              link: { ...settings.link, title: event.target.checked },
            })
          }
          label={intl.getMessage('settings_general_links_title_attribute_label')}
        />
        <SettingsSwitch
          checked={settings.link.target}
          onChange={(event) =>
            onChange({
              ...settings,
              link: { ...settings.link, target: event.target.checked },
            })
          }
          label={intl.getMessage('settings_general_links_target_attribute_label')}
          helperText={intl.getMessage('settings_general_links_target_attribute_helper_text')}
        />
      </SettingsSection>

      <SettingsSection
        title={intl.getMessage('settings_general_markdown_title')}
        description={intl.getMessage('settings_general_markdown_description')}
      >
        <SettingsSwitch
          checked={settings.markdown.inline}
          onChange={(event) =>
            onChange({
              ...settings,
              markdown: { ...settings.markdown, inline: event.target.checked },
            })
          }
          label={intl.getMessage('settings_general_markdown_inline_label')}
          helperText={intl.getMessage('settings_general_markdown_inline_helper_text')}
        />
      </SettingsSection>
    </>
  );
}
