import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { useErrorBoundary } from 'react-error-boundary';
import { useIntl } from 'extension/common/intl/intl.context';
import { SettingsGeneral } from 'extension/common/settings/settings.model';
import { TemplateActionMode } from 'extension/template/template-action-mode.enum';
import { TemplateContextMenuMode } from 'extension/template/template-context-menu-mode.enum';
import { Template } from 'extension/template/template.model';
import { useTemplates } from 'extension/template/templates.context';
import { SettingsPageProps } from 'extension/ui/options/component/settings-dialog/settings-page.model';
import { SettingsSection } from 'extension/ui/options/component/settings-section/settings-section';
import { SettingsSwitch } from 'extension/ui/options/component/settings-switch/settings-switch';

export function GeneralSettings({ onChange, settings }: SettingsPageProps<SettingsGeneral>) {
  const intl = useIntl();
  const templateService = useTemplates();
  const { showBoundary } = useErrorBoundary();
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setTemplates(await templateService.getTemplates());
      } catch (e) {
        showBoundary(e);
      }
    })();
  }, [showBoundary, templateService]);

  const isPopupMode = settings.action.mode === TemplateActionMode.Popup;

  return (
    <>
      <SettingsSection
        title={intl.getMessage('settings_general_toolbar_button_title')}
        description={intl.getMessage('settings_general_toolbar_button_description')}
      >
        <FormControl>
          <RadioGroup
            value={settings.action.mode}
            onChange={(event) =>
              onChange({
                ...settings,
                action: { ...settings.action, mode: event.target.value as TemplateActionMode },
              })
            }
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
          <TextField
            select
            fullWidth
            label={intl.getMessage('settings_general_toolbar_button_template_field_label')}
            value={
              templates.some((template) => template.id === settings.action.templateId) ? settings.action.templateId : ''
            }
            helperText={intl.getMessage('settings_general_toolbar_button_template_field_helper_text')}
            onChange={(event) =>
              onChange({
                ...settings,
                action: { ...settings.action, templateId: event.target.value },
              })
            }
          >
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id} disabled={!template.enabled}>
                {templateService.getTemplateTitle(template)}
                {!template.enabled &&
                  ` (${intl.getMessage('settings_general_toolbar_button_template_option_disabled_label')})`}
              </MenuItem>
            ))}
          </TextField>
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
        <FormControl disabled={!settings.contextMenu.enabled}>
          <FormLabel>{intl.getMessage('settings_general_context_menu_behaviour_label')}</FormLabel>
          <RadioGroup
            value={settings.contextMenu.mode}
            onChange={(event) =>
              onChange({
                ...settings,
                contextMenu: { ...settings.contextMenu, mode: event.target.value as TemplateContextMenuMode },
              })
            }
          >
            <FormControlLabel
              value={TemplateContextMenuMode.Menu}
              control={<Radio />}
              disabled={!settings.contextMenu.enabled}
              label={intl.getMessage('settings_general_context_menu_mode_menu_label')}
            />
            <FormControlLabel
              value={TemplateContextMenuMode.Template}
              control={<Radio />}
              disabled={!settings.contextMenu.enabled}
              label={intl.getMessage('settings_general_context_menu_mode_template_label')}
            />
          </RadioGroup>
        </FormControl>
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
