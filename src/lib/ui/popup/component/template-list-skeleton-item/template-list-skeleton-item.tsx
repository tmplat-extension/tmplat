import 'extension/ui/popup/component/template-list-skeleton-item/template-list-skeleton-item.scss';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

export function TemplateListSkeletonItem() {
  return (
    <Typography variant="h5" className="template-list-skeleton-item">
      <Skeleton variant="rectangular" />
    </Typography>
  );
}
