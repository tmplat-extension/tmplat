import 'extension/ui/popup/component/template-list-item/template-list-item.scss';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { MessageType } from 'extension/common/message/message-type.enum';
import { useMessages } from 'extension/common/message/messages.context';
import { getShortcutModifier } from 'extension/common/system/system.utils';
import { Tab } from 'extension/tab/tab.model';
import { useTabs } from 'extension/tab/tabs.context';
import { ExecuteTemplateMessageSource } from 'extension/template/message/execute-template-message-source.enum';
import { ExecuteTemplateMessage } from 'extension/template/message/execute-template-message.model';
import { Template } from 'extension/template/template.model';
import { TemplatePopupInfoAction, TemplatePopupInfoShortcuts } from 'extension/template/template.service';
import { useTemplates } from 'extension/template/templates.context';

export function TemplateListItem({ action, shortcuts, tabIndex, template }: TemplateListItemProps) {
  const messages = useMessages();
  const tabs = useTabs();
  const templates = useTemplates();

  async function onClick() {
    let tab: Tab | undefined;

    try {
      tab = await tabs.findActiveTab();
    } catch (_) {
      // Do nothing
    }

    messages.sendMessage<ExecuteTemplateMessage>(MessageType.ExecuteTemplate, {
      id: template.id,
      source: ExecuteTemplateMessageSource.Popup,
      tabId: tab?.id,
    });

    if (action.autoCloseEnabled) {
      close();
    }
  }

  // TODO: Pad template title to provide gap before shortcut
  return (
    <MenuItem onClick={onClick} tabIndex={tabIndex}>
      <ListItemText className="template-list-item-title">{templates.getTemplateTitle(template)}</ListItemText>
      {shortcuts.enabled && template.shortcut && (
        <Typography variant="body2" color="text.secondary">
          {getShortcutModifier()}
          {template.shortcut}
        </Typography>
      )}
    </MenuItem>
  );
}

export type TemplateListItemProps = {
  action: TemplatePopupInfoAction;
  shortcuts: TemplatePopupInfoShortcuts;
  tabIndex?: number;
  template: Template;
};
