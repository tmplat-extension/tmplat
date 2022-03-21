import { Alert, AlertTitle, ListItemText, MenuItem, MenuList } from '@mui/material';
import { Async } from 'react-async';

import 'extension/ui/popup/component/template-list/template-list.scss';
import { IntlMessageKey } from 'extension/common/intl/intl-message-key.enum';
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
          <AlertTitle>{intl.getMessage(IntlMessageKey.Error)}</AlertTitle>
          {intl.getMessage(IntlMessageKey.PopupError)}
        </Alert>
      </Async.Rejected>
      <Async.Fulfilled>
        {(data: TemplatePopupInfo) => (
          <MenuList dense>
            {data.templates.length ? (
              data.templates.map((template) => (
                <TemplateListItem
                  key={template.id}
                  action={data.action}
                  shortcuts={data.shortcuts}
                  template={template}
                />
              ))
            ) : (
              <MenuItem disabled>
                <ListItemText inset>{intl.getMessage(IntlMessageKey.MenuEmpty)}</ListItemText>
              </MenuItem>
            )}
            {data.action.optionLinkEnabled && <TemplateListOptionsItem />}
          </MenuList>
        )}
      </Async.Fulfilled>
    </Async>
  );
}
