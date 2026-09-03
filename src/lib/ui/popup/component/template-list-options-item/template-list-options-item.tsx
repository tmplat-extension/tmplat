import 'extension/ui/popup/component/template-list-options-item/template-list-options-item.scss';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import { useIntl } from 'extension/common/intl/intl.context';

export function TemplateListOptionsItem({ tabIndex }: TemplateListOptionsItemProps) {
  const intl = useIntl();

  function onClick() {
    // TODO: How to handle error?
    browser.runtime.openOptionsPage();
  }

  return (
    <>
      <Divider />
      <MenuItem onClick={onClick} tabIndex={tabIndex}>
        <ListItemText>{intl.getMessage('options')}</ListItemText>
      </MenuItem>
    </>
  );
}

export type TemplateListOptionsItemProps = {
  tabIndex?: number;
};
