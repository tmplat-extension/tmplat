import 'extension/ui/popup/component/template-list-options-item/template-list-options-item.scss';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { useLogger } from 'extension/common/logging/logging.context';

export function TemplateListOptionsItem({ tabIndex }: TemplateListOptionsItemProps) {
  const intl = useIntl();
  const logger = useLogger('TemplateListOptionsItem');
  const [error, setError] = useState<string>();

  async function onClick() {
    try {
      await browser.runtime.openOptionsPage();
    } catch (e) {
      logger.error('Failed to open options page:', e);
      setError(intl.getMessage('popup_open_options_error'));
    }
  }

  return (
    <>
      <Divider />
      <MenuItem onClick={onClick} tabIndex={tabIndex}>
        <ListItemText>{intl.getMessage('options')}</ListItemText>
      </MenuItem>
      {error && (
        <Alert severity="error" className="template-list-options-item-error" onClose={() => setError(undefined)}>
          {error}
        </Alert>
      )}
    </>
  );
}

export type TemplateListOptionsItemProps = {
  tabIndex?: number;
};
