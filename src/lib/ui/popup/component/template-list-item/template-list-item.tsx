import { ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';

import 'extension/ui/popup/component/template-list-item/template-list-item.scss';
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
import { TemplateIcon } from 'extension/ui/common/component/template-icon/template-icon';

export function TemplateListItem({ action, shortcuts, template }: TemplateListItemProps) {
  const messages = useMessages();
  const tabs = useTabs();
  const templates = useTemplates();

  async function onClick() {
    let tab: Tab | undefined;

    try {
      tab = await tabs.findActiveTab();
    } catch (_) {}

    messages.sendMessage<ExecuteTemplateMessage>(MessageType.ExecuteTemplate, {
      id: template.id,
      source: ExecuteTemplateMessageSource.Popup,
      tabId: tab?.id,
    });

    if (action.autoCloseEnabled) {
      /*
       * TODO: Close popup or should this be done from background page (e.g. for progress - or can progress be tracked
       *  in a notification message, when enabled)?
       */
    }
  }

  // TODO: Pad template title to provide gap before shortcut
  return (
    <MenuItem onClick={onClick}>
      {template.icon && (
        <ListItemIcon>
          <TemplateIcon name={template.icon} fontSize="small" />
        </ListItemIcon>
      )}
      <ListItemText inset={!template.icon} className="template-list-item-title">
        {templates.getTemplateTitle(template)}
      </ListItemText>
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
  template: Template;
};
