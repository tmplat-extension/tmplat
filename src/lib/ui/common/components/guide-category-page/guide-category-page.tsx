import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ReactNode } from 'react';
import { GuideEntry, GuideExample } from 'extension/ui/common/components/guide/guide.model';
import { GuideEntryTable } from 'extension/ui/common/components/guide-entry-table/guide-entry-table';
import { GuideExamples } from 'extension/ui/common/components/guide-examples/guide-examples';

/**
 * Consistent layout for a guide page covering a single template context category.
 */
export function GuideCategoryPage({ description, entries, examples, title, typeHeader }: GuideCategoryPageProps) {
  return (
    <Box component="section">
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>
      <GuideExamples examples={examples} />
      <GuideEntryTable entries={entries} typeHeader={typeHeader} />
    </Box>
  );
}

export type GuideCategoryPageProps = {
  description: ReactNode;
  entries: readonly GuideEntry[];
  examples: readonly GuideExample[];
  title: ReactNode;
  typeHeader: string;
};
