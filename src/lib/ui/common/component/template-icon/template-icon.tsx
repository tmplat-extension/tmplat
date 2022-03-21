import * as icons from '@mui/icons-material';

import 'extension/ui/common/component/template-icon/template-icon.scss';

import { TemplateIconName } from 'extension/template/template-icon-name.model';

export function TemplateIcon({ name, ...allProps }: TemplateIconProps) {
  // eslint-disable-next-line import/namespace
  const Icon = icons[name];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return <Icon {...allProps} />;
}

export type TemplateIconProps = JSX.IntrinsicElements['svg'] & {
  name: TemplateIconName;
};
