import 'extension/ui/popup/component/template-list/template-list.scss';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import { Async } from 'react-async';
import { useIntl } from 'extension/common/intl/intl.context';
import { TemplatePopupInfo } from 'extension/template/template.service';
import { useTemplates } from 'extension/template/templates.context';
import { TemplateListItem } from 'extension/ui/popup/component/template-list-item/template-list-item';
import { TemplateListOptionsItem } from 'extension/ui/popup/component/template-list-options-item/template-list-options-item';
import { TemplateListSkeletonItem } from 'extension/ui/popup/component/template-list-skeleton-item/template-list-skeleton-item';

export function TemplateList() {
  const intl = useIntl();
  const templates = useTemplates();

  return (
    <Async promiseFn={templates.getTemplatePopupInfo.bind(templates)}>
      <Async.Pending>
        <TemplateListSkeletonItem />
        <TemplateListSkeletonItem />
        <TemplateListSkeletonItem />
        <TemplateListSkeletonItem />
      </Async.Pending>
      <Async.Rejected>
        <Alert severity="error" className="template-list-error">
          <AlertTitle>{intl.getMessage('error')}</AlertTitle>
          {intl.getMessage('popup_error')}
        </Alert>
      </Async.Rejected>
      <Async.Fulfilled>
        {(data: TemplatePopupInfo) => (
          <MenuList dense>
            {data.templates.length ? (
              data.templates.map((template, i) => (
                <TemplateListItem
                  key={template.id}
                  action={data.action}
                  shortcuts={data.shortcuts}
                  template={template}
                  tabIndex={i + 1}
                />
              ))
            ) : (
              <MenuItem disabled>
                <ListItemText inset>{intl.getMessage('menu_empty')}</ListItemText>
              </MenuItem>
            )}
            {data.action.optionLinkEnabled && <TemplateListOptionsItem tabIndex={data.templates.length + 1} />}
          </MenuList>
        )}
      </Async.Fulfilled>
    </Async>
  );
}
