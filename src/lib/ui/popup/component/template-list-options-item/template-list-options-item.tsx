import { Settings } from '@mui/icons-material';
import { Divider, ListItemIcon, ListItemText, MenuItem } from '@mui/material';

import 'extension/ui/popup/component/template-list-options-item/template-list-options-item.scss';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
import { useIntl } from 'extension/common/intl/intl.context';

export function TemplateListOptionsItem() {
  const intl = useIntl();

  function onClick() {
    chrome.runtime.openOptionsPage();
  }

  return (
    <>
      <Divider />
      <MenuItem onClick={onClick}>
        <ListItemIcon>
          <Settings fontSize="small" />
        </ListItemIcon>
        <ListItemText>{intl.getMessage(IntlMessageKey.Options)}</ListItemText>
      </MenuItem>
    </>
  );
}
