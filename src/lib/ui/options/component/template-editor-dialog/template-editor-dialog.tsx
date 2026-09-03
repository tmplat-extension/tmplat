import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import HelpIcon from '@mui/icons-material/Help';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import _isEqual from 'lodash.isequal';
import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { IntlService } from 'extension/common/intl/intl.service';
import { getShortcutModifier } from 'extension/common/system/system.utils';
import { useTabs } from 'extension/tab/tabs.context';
import { TEMPLATE_TITLE_MAX_LENGTH } from 'extension/template/template-transfer.model';
import { Template } from 'extension/template/template.model';
import { useTemplates } from 'extension/template/templates.context';
import { ConfirmDialog } from 'extension/ui/options/component/confirm-dialog/confirm-dialog';
import { getErrorMessage } from 'extension/ui/options/component/options-error.utils';

const emptyForm: TemplateEditorForm = {
  content: '',
  description: '',
  enabled: true,
  shortcut: '',
  title: '',
};

/**
 * Appends `suffix` to `title`, truncating it as necessary so the result never exceeds `TEMPLATE_TITLE_MAX_LENGTH`.
 *
 * If `title` already ends with `suffix` (e.g. cloning a template that is itself a clone), it's returned unchanged
 * rather than having the suffix applied a second time.
 */
function getCloneTitle(title: string, suffix: string): string {
  if (title.endsWith(suffix)) {
    return title;
  }

  const maxBaseLength = Math.max(0, TEMPLATE_TITLE_MAX_LENGTH - suffix.length);

  return `${title.slice(0, maxBaseLength)}${suffix}`;
}

/**
 * Validates the state of the template editor, returning a message per invalid field.
 *
 * Predefined templates only expose `enabled` and `shortcut`, so their (immutable) title and content are never
 * validated.
 */
export function getTemplateEditorErrors(
  form: TemplateEditorForm,
  { intl, predefined, template, templates }: TemplateEditorValidationContext,
): TemplateEditorErrors {
  const errors: TemplateEditorErrors = {};

  if (!predefined) {
    const title = form.title.trim();
    if (!title) {
      errors.title = intl.getMessage('template_editor_error_title_required');
    } else if (title.length > TEMPLATE_TITLE_MAX_LENGTH) {
      errors.title = intl.getMessage('template_editor_error_title_too_long', String(TEMPLATE_TITLE_MAX_LENGTH));
    }

    if (!form.content.trim()) {
      errors.content = intl.getMessage('template_editor_error_content_required');
    }
  }

  const shortcut = form.shortcut.trim();
  if (shortcut.length > 1) {
    errors.shortcut = intl.getMessage('template_editor_error_shortcut_too_long');
  } else if (shortcut) {
    const conflict = templates.find((other) => other.id !== template?.id && other.shortcut === shortcut.toUpperCase());
    if (conflict) {
      errors.shortcut = intl.getMessage('template_editor_error_shortcut_conflict');
    }
  }

  return errors;
}

/**
 * Creates a new user-defined template or modifies an existing one, replacing the legacy options page "template wizard".
 *
 * Predefined templates can be opened here as well but - exactly as in the legacy wizard - only their shortcut and
 * enabled state can be changed; their title, description and content are immutable and shown read-only.
 *
 * Passing `cloneFrom` instead of `template` pre-populates the title, description and content from another template
 * (predefined or otherwise) while always creating a brand new, fully editable custom template - its `enabled` and
 * `shortcut` are reset to the same defaults used when creating a template from scratch, rather than being copied.
 *
 * This is mounted only while open so that the form is always populated afresh and any unsaved changes are discarded.
 */
export function TemplateEditorDialog({
  cloneFrom,
  onClose,
  onSaved,
  open,
  template,
  templates,
}: TemplateEditorDialogProps) {
  const intl = useIntl();
  const tabs = useTabs();
  const templateService = useTemplates();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof TemplateEditorErrors, boolean>>>({});
  const [pendingDelete, setPendingDelete] = useState(false);

  const initialForm = useMemo<TemplateEditorForm>(() => {
    if (template) {
      return {
        content: template.content,
        description: templateService.getTemplateDescription(template) ?? '',
        enabled: template.enabled,
        shortcut: template.shortcut ?? '',
        title: templateService.getTemplateTitle(template),
      };
    }

    if (cloneFrom) {
      return {
        ...emptyForm,
        content: cloneFrom.content,
        description: templateService.getTemplateDescription(cloneFrom) ?? '',
        title: getCloneTitle(
          templateService.getTemplateTitle(cloneFrom),
          intl.getMessage('template_editor_clone_title_suffix'),
        ),
      };
    }

    return emptyForm;
  }, [cloneFrom, intl, template, templateService]);
  const [form, setForm] = useState<TemplateEditorForm>(initialForm);

  const predefined = !!template?.predefined;
  const canDelete = !!template && !predefined;

  const errors = useMemo(
    () => getTemplateEditorErrors(form, { intl, predefined, template, templates }),
    [form, intl, predefined, template, templates],
  );

  // A brand new template (including one pre-populated via `cloneFrom`) has no persisted state to compare against, so
  // it's always considered dirty - only an edit to an existing template needs to actually differ before it can be
  // saved.
  const dirty = !template || !_isEqual(form, initialForm);
  const valid = !Object.keys(errors).length;
  const canSave = dirty && valid && !saving;

  const handleBlur = useCallback((field: keyof TemplateEditorErrors) => {
    setTouched((current) => ({ ...current, [field]: true }));
  }, []);

  const handleOpenGuide = useCallback(() => {
    void tabs.createExtensionTab('guide.html');
  }, [tabs]);

  const contentHelperText = useMemo(
    () => (
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Tooltip title={intl.getMessage('template_editor_content_field_guide_tooltip')}>
          <IconButton
            aria-label={intl.getMessage('template_editor_content_field_guide_tooltip')}
            size="small"
            onClick={handleOpenGuide}
          >
            <HelpIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <span>{intl.getMessage('template_editor_content_field_helper_text')}</span>
      </Stack>
    ),
    [handleOpenGuide, intl],
  );

  const fieldError = useCallback(
    (field: keyof TemplateEditorErrors) => (touched[field] ? errors[field] : undefined),
    [errors, touched],
  );

  const handleSave = useCallback(async () => {
    setError(undefined);
    setSaving(true);

    try {
      const shortcut = form.shortcut.trim().toUpperCase() || null;

      if (!template) {
        await templateService.createTemplate({
          content: form.content,
          description: form.description.trim() || null,
          enabled: form.enabled,
          shortcut,
          title: form.title.trim(),
        });
      } else if (template.predefined) {
        await templateService.updateTemplate(template.id, { enabled: form.enabled, shortcut });
      } else {
        await templateService.updateTemplate(template.id, {
          content: form.content,
          description: form.description.trim() || null,
          enabled: form.enabled,
          shortcut,
          title: form.title.trim(),
        });
      }

      await onSaved();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e, intl));
    } finally {
      setSaving(false);
    }
  }, [form, intl, onClose, onSaved, template, templateService]);

  const handleDelete = useCallback(async () => {
    if (!template) {
      return;
    }

    setPendingDelete(false);
    setError(undefined);
    setSaving(true);

    try {
      await templateService.removeTemplates([template.id]);
      await onSaved();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e, intl));
    } finally {
      setSaving(false);
    }
  }, [intl, onClose, onSaved, template, templateService]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
          {template ? intl.getMessage('template_editor_title_edit') : intl.getMessage('template_editor_title_add')}
          <Tooltip
            title={intl.getMessage(form.enabled ? 'template_editor_enabled_label' : 'template_editor_disabled_label')}
          >
            <Switch
              checked={form.enabled}
              slotProps={{ input: { 'aria-label': intl.getMessage('template_editor_enabled_label') } }}
              onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
            />
          </Tooltip>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(undefined)}>
                {error}
              </Alert>
            )}
            {predefined && <Alert severity="info">{intl.getMessage('template_editor_predefined_description')}</Alert>}
            <TextField
              autoFocus={!predefined}
              fullWidth
              required
              disabled={predefined}
              label={intl.getMessage('template_editor_title_field_label')}
              value={form.title}
              error={!!fieldError('title')}
              helperText={fieldError('title') ?? intl.getMessage('template_editor_title_field_helper_text')}
              slotProps={{
                htmlInput: { maxLength: TEMPLATE_TITLE_MAX_LENGTH },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography
                        variant="caption"
                        color={fieldError('title') ? 'error' : predefined ? 'textDisabled' : 'textSecondary'}
                      >
                        {intl.getMessage(
                          'template_editor_title_field_count',
                          String(form.title.trim().length),
                          String(TEMPLATE_TITLE_MAX_LENGTH),
                        )}
                      </Typography>
                    </InputAdornment>
                  ),
                },
              }}
              onBlur={() => handleBlur('title')}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
            <TextField
              fullWidth
              disabled={predefined}
              label={intl.getMessage('template_editor_description_field_label')}
              value={form.description}
              helperText={intl.getMessage('template_editor_description_field_helper_text')}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
            <TextField
              autoFocus={predefined}
              fullWidth
              required={!predefined}
              multiline
              minRows={8}
              maxRows={20}
              disabled={predefined}
              label={intl.getMessage('template_editor_content_field_label')}
              value={form.content}
              error={!!fieldError('content')}
              helperText={fieldError('content') ?? contentHelperText}
              slotProps={{
                formHelperText: { component: 'div' },
                htmlInput: { spellCheck: false, style: { fontFamily: 'monospace' } },
              }}
              onBlur={() => handleBlur('content')}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
            />
            <TextField
              fullWidth
              label={intl.getMessage('template_editor_shortcut_field_label')}
              value={form.shortcut}
              error={!!fieldError('shortcut')}
              helperText={fieldError('shortcut') ?? intl.getMessage('template_editor_shortcut_field_helper_text')}
              slotProps={{
                htmlInput: { maxLength: 1, style: { textTransform: 'uppercase' } },
                input: {
                  startAdornment: <InputAdornment position="start">{getShortcutModifier()}</InputAdornment>,
                  endAdornment: form.shortcut && (
                    <InputAdornment position="end">
                      <Tooltip title={intl.getMessage('template_editor_shortcut_clear_label')}>
                        <IconButton
                          aria-label={intl.getMessage('template_editor_shortcut_clear_label')}
                          edge="end"
                          size="small"
                          onClick={() => setForm({ ...form, shortcut: '' })}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ '& .MuiInputBase-root': { width: '20ch' } }}
              onBlur={() => handleBlur('shortcut')}
              onChange={(event) => setForm({ ...form, shortcut: event.target.value.toUpperCase() })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: canDelete ? 'space-between' : 'flex-end' }}>
          {canDelete && (
            <Button color="error" startIcon={<DeleteIcon />} disabled={saving} onClick={() => setPendingDelete(true)}>
              {intl.getMessage('template_editor_delete_button')}
            </Button>
          )}
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose}>{intl.getMessage('template_editor_cancel_button')}</Button>
            <Button variant="contained" disabled={!canSave} onClick={handleSave}>
              {intl.getMessage('template_editor_save_button')}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={pendingDelete}
        destructive
        title={intl.getMessage('template_editor_delete_confirm_title')}
        content={intl.getMessage('template_editor_delete_confirm_content')}
        confirmText={intl.getMessage('template_editor_delete_confirm_button')}
        onCancel={() => setPendingDelete(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}

export type TemplateEditorDialogProps = {
  /**
   * A template whose title, description and content are used to pre-populate a new template, ignored when
   * `template` is also provided. Its `enabled` and `shortcut` are never copied.
   */
  cloneFrom?: Template;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  open: boolean;
  /**
   * The template being modified, or `undefined` when a template is being created (optionally from `cloneFrom`).
   */
  template?: Template;
  /**
   * Every existing template, used to ensure that shortcuts remain unique.
   */
  templates: readonly Template[];
};

export type TemplateEditorErrors = {
  content?: string;
  shortcut?: string;
  title?: string;
};

export type TemplateEditorForm = {
  content: string;
  description: string;
  enabled: boolean;
  shortcut: string;
  title: string;
};

type TemplateEditorValidationContext = {
  intl: IntlService;
  predefined: boolean;
  template?: Template;
  templates: readonly Template[];
};
