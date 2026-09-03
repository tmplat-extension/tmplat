import 'extension/ui/popup/component/template-list-item/template-list-item.scss';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { type MouseEvent, useEffect, useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { useLogger } from 'extension/common/logging/logging.context';
import { MessageType } from 'extension/common/message/message-type.enum';
import { useMessages } from 'extension/common/message/messages.context';
import { getShortcutModifier } from 'extension/common/system/system.utils';
import { type Tab } from 'extension/tab/tab.model';
import { useTabs } from 'extension/tab/tabs.context';
import { ExecuteTemplateMessageOutcome } from 'extension/template/message/execute-template-message-outcome.enum';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';
import {
  type ExecuteTemplateMessageInput,
  type ExecuteTemplateMessageOutput,
} from 'extension/template/message/execute-template-message.schema';
import { type Template } from 'extension/template/template.model';
import { type TemplatePopupInfoAction, type TemplatePopupInfoShortcuts } from 'extension/template/template.service';
import { useTemplates } from 'extension/template/templates.context';
import { useErrorMessage } from 'extension/ui/common/hooks/use-error-message';

// How long the (dismissable-free) success indicator is shown before it automatically disappears.
const SUCCESS_INDICATOR_DURATION_MS = 1000;

function onIndicatorClick(e: MouseEvent) {
  // Clicking anywhere on an indicator (not just its dismiss button, if present) should never re-run the template -
  // it can still be superseded/cleared by clicking elsewhere on the item, without an explicit dismiss.
  e.stopPropagation();
}

export function TemplateListItem({
  action,
  disabled,
  onBusyChange,
  shortcuts,
  tabIndex,
  template,
}: TemplateListItemProps) {
  const getErrorMessage = useErrorMessage();
  const intl = useIntl();
  const logger = useLogger('TemplateListItem');
  const messages = useMessages();
  const tabs = useTabs();
  const templates = useTemplates();
  const [executing, setExecuting] = useState(false);
  const [indicator, setIndicator] = useState<TemplateExecutionIndicator>();
  const pendingAutoClose = indicator?.type === 'success' && action.autoCloseEnabled;
  const busy = executing || pendingAutoClose;

  useEffect(() => {
    onBusyChange(template.id, busy);
  }, [busy, onBusyChange, template.id]);

  useEffect(() => {
    if (indicator?.type !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIndicator(undefined);

      // The popup is only auto-closed once the success indicator has had a chance to be seen, rather than
      // immediately, so it isn't skipped entirely for auto-closing templates.
      if (action.autoCloseEnabled) {
        close();
      }
    }, SUCCESS_INDICATOR_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [action.autoCloseEnabled, indicator]);

  async function onClick() {
    // Guards against a double-click firing the template a second time while the first execution is still in flight,
    // and against any click once a successful execution is about to auto-close the popup. This is deliberately not
    // reflected via MenuItem's own `disabled` prop for *this* item, since that would visually fade its own success
    // indicator too (other items are disabled instead, via `disabled`).
    if (busy) {
      return;
    }

    setExecuting(true);
    setIndicator(undefined);

    let tab: Tab | undefined;

    try {
      tab = await tabs.findActiveTab();
    } catch (e) {
      logger.warn('Failed to find active tab:', e);
    }

    try {
      const output = await messages.sendMessageAwaitResponse<ExecuteTemplateMessageInput, ExecuteTemplateMessageOutput>(
        MessageType.ExecuteTemplate,
        {
          id: template.id,
          source: ExecuteTemplateMessageSource.Popup,
          suppressNotifications: true,
          tabId: tab?.id,
        },
      );

      if (output.outcome === ExecuteTemplateMessageOutcome.Skipped) {
        logger.warn('Template execution skipped:', output.reason);
        // The popup is deliberately kept open (even if auto-close is enabled) so the user has a chance to see this.
        setIndicator({ type: 'warning', message: output.reason });
      } else {
        logger.info('Template execution successful:', output.output);
        setIndicator({ type: 'success' });
      }
    } catch (e) {
      logger.error('Template execution failed:', e);
      // The popup is deliberately kept open (even if auto-close is enabled) so the user has a chance to see this.
      setIndicator({ type: 'error', message: getErrorMessage(e) });
    } finally {
      setExecuting(false);
    }
  }

  function onDismissIndicator(e: MouseEvent) {
    // Also stops propagation (like onIndicatorClick above) so dismissing doesn't re-run the template.
    e.stopPropagation();
    setIndicator(undefined);
  }

  return (
    <MenuItem onClick={onClick} tabIndex={tabIndex} disabled={disabled || executing}>
      <ListItemText className="template-list-item-title">{templates.getTemplateTitle(template)}</ListItemText>
      {indicator ? (
        // MUI's Tooltip is a Popper that can be clipped by the extension popup's tiny viewport, so a native
        // "title" attribute is used here instead, which the browser renders outside document bounds.
        <Stack
          direction="row"
          sx={{ alignItems: 'center' }}
          className="template-list-item-indicator"
          title={indicator.type === 'success' ? undefined : indicator.message}
          onClick={onIndicatorClick}
        >
          {indicator.type === 'error' && <ErrorOutlineIcon color="error" fontSize="small" />}
          {indicator.type === 'warning' && <WarningAmberOutlinedIcon color="warning" fontSize="small" />}
          {indicator.type === 'success' && <CheckCircleOutlinedIcon color="success" fontSize="small" />}
          {indicator.type !== 'success' && (
            <IconButton
              size="small"
              color={indicator.type}
              onClick={onDismissIndicator}
              aria-label={intl.getMessage(
                indicator.type === 'error'
                  ? 'popup_execute_template_error_dismiss_button'
                  : 'popup_execute_template_warning_dismiss_button',
              )}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          )}
        </Stack>
      ) : (
        shortcuts.enabled &&
        template.shortcut && (
          <Typography variant="body2" color="text.secondary">
            {getShortcutModifier()}
            {template.shortcut}
          </Typography>
        )
      )}
    </MenuItem>
  );
}

type TemplateExecutionIndicator =
  | { type: 'error'; message: string }
  | { type: 'warning'; message: string }
  | { type: 'success' };

export type TemplateListItemProps = {
  action: TemplatePopupInfoAction;
  /**
   * Whether this item is disabled because *another* template is currently executing or awaiting an auto-close.
   */
  disabled?: boolean;
  /**
   * Called whenever this item starts or stops being busy (i.e. executing or awaiting an auto-close) so that sibling
   * items can be disabled for its duration.
   */
  onBusyChange: (templateId: string, busy: boolean) => void;
  shortcuts: TemplatePopupInfoShortcuts;
  tabIndex?: number;
  template: Template;
};
