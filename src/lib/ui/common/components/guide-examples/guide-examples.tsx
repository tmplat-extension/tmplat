import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useIntl } from 'extension/common/intl/intl.context';
import { GuideExample } from 'extension/ui/common/components/guide/guide.model';
import { GuideCode } from 'extension/ui/common/components/guide-code/guide-code';

/**
 * Renders the hard-coded examples for a category, each pairing a template with the output it would produce.
 */
export function GuideExamples({ examples }: GuideExamplesProps) {
  const intl = useIntl();

  return (
    <Stack spacing={1.5} sx={{ mb: 4 }}>
      {examples.map((example) => (
        <Paper key={example.template} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {intl.getMessage(example.descriptionKey)}
          </Typography>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            sx={{ alignItems: { xs: 'stretch', md: 'center' }, minWidth: 0 }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <GuideCode block>{example.template}</GuideCode>
            </Box>
            <ArrowForwardIcon
              fontSize="small"
              color="disabled"
              sx={{ alignSelf: 'center', transform: { xs: 'rotate(90deg)', md: 'none' } }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <GuideCode block>{example.output}</GuideCode>
            </Box>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

export type GuideExamplesProps = {
  examples: readonly GuideExample[];
};
