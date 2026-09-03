import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { ReactNode } from 'react';
import { useIntl } from 'extension/common/intl/intl.context';
import { GuideRichText } from 'extension/ui/common/components/guide-rich-text/guide-rich-text';

function GuideIntroductionSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Box component="section" sx={{ mb: 3 }}>
      <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 'medium' }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 1.5, mt: 0.5 }} />
      {children}
    </Box>
  );
}

/**
 * A primer on the template syntax itself, which is inherently static as it describes the engine rather than any of the
 * entries that it exposes.
 *
 * Note that `tmplat-mustache` is a fork of mustache.js: tags use single curly braces, values are unescaped by default,
 * and it is `{{name}}`/`{&name}` that escapes.
 */
export function GuideIntroduction() {
  const intl = useIntl();

  return (
    <Box component="section">
      <Typography variant="h6" component="h2" gutterBottom>
        {intl.getMessage('guide_introduction_title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {intl.getMessage('guide_introduction_lead_message')}
      </Typography>

      <GuideIntroductionSection title={intl.getMessage('guide_introduction_tags_title')}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <GuideRichText text={intl.getMessage('guide_introduction_tags_text_1')} />
        </Typography>
        <Typography variant="body2">
          <GuideRichText text={intl.getMessage('guide_introduction_tags_text_2')} />
        </Typography>
      </GuideIntroductionSection>

      <GuideIntroductionSection title={intl.getMessage('guide_introduction_escaping_title')}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <GuideRichText text={intl.getMessage('guide_introduction_escaping_text_1')} />
        </Typography>
        <Typography variant="body2">
          <GuideRichText text={intl.getMessage('guide_introduction_escaping_text_2')} />
        </Typography>
      </GuideIntroductionSection>

      <GuideIntroductionSection title={intl.getMessage('guide_introduction_sections_title')}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <GuideRichText text={intl.getMessage('guide_introduction_sections_text_1')} />
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 3 }}>
          <Typography component="li" variant="body2">
            <GuideRichText text={intl.getMessage('guide_introduction_sections_conditions_text')} />
          </Typography>
          <Typography component="li" variant="body2">
            <GuideRichText text={intl.getMessage('guide_introduction_sections_iterating_text')} />
          </Typography>
          <Typography component="li" variant="body2">
            <GuideRichText text={intl.getMessage('guide_introduction_sections_access_text')} />
          </Typography>
          <Typography component="li" variant="body2">
            <GuideRichText text={intl.getMessage('guide_introduction_sections_operations_text')} />
          </Typography>
        </Box>
      </GuideIntroductionSection>

      <GuideIntroductionSection title={intl.getMessage('guide_introduction_inverted_sections_title')}>
        <Typography variant="body2">
          <GuideRichText text={intl.getMessage('guide_introduction_inverted_sections_text')} />
        </Typography>
      </GuideIntroductionSection>

      <GuideIntroductionSection title={intl.getMessage('guide_introduction_dot_notation_title')}>
        <Typography variant="body2">
          <GuideRichText text={intl.getMessage('guide_introduction_dot_notation_text')} />
        </Typography>
      </GuideIntroductionSection>

      <GuideIntroductionSection title={intl.getMessage('guide_introduction_lists_objects_values_title')}>
        <Typography variant="body2">
          <GuideRichText text={intl.getMessage('guide_introduction_lists_objects_values_text')} />
        </Typography>
      </GuideIntroductionSection>

      <GuideIntroductionSection title={intl.getMessage('guide_introduction_comments_title')}>
        <Typography variant="body2">
          <GuideRichText text={intl.getMessage('guide_introduction_comments_text')} />
        </Typography>
      </GuideIntroductionSection>

      <GuideIntroductionSection title={intl.getMessage('guide_introduction_case_sensitivity_title')}>
        <Typography variant="body2">
          <GuideRichText text={intl.getMessage('guide_introduction_case_sensitivity_text')} />
        </Typography>
      </GuideIntroductionSection>

      <Alert severity="info">
        <AlertTitle>{intl.getMessage('guide_introduction_notes_title')}</AlertTitle>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {intl.getMessage('guide_introduction_notes_text_1')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {intl.getMessage('guide_introduction_notes_text_2')}
        </Typography>
        <Typography variant="body2">{intl.getMessage('guide_introduction_notes_text_3')}</Typography>
      </Alert>
    </Box>
  );
}
