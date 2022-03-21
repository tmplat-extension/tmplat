import { Skeleton, Typography } from '@mui/material';

import 'extension/ui/popup/component/template-list-skeleton-item/template-list-skeleton-item.scss';

export function TemplateListSkeletonItem() {
  return (
    <Typography variant="h5" className="template-list-skeleton-item">
      <Skeleton variant="rectangular" />
    </Typography>
  );
}
