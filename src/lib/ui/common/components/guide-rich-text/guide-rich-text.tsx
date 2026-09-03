import { Fragment } from 'react';
import { GuideCode } from 'extension/ui/common/components/guide-code/guide-code';

const RICH_TEXT_PATTERN = /(`[^`]+`|\*\*[^*]+\*\*)/g;

/**
 * Renders a localised guide message that may contain a lightweight markup subset, so that inline template syntax and
 * emphasis keep their intended styling without requiring embedded JSX in translated strings (which the extension's
 * i18n messages can't express):
 *  - `` `{name}` `` renders as monospaced {@link GuideCode}
 *  - `**word**` renders as `<strong>`
 *
 * Anything else is rendered as plain text, verbatim.
 */
export function GuideRichText({ text }: GuideRichTextProps) {
  return text.split(RICH_TEXT_PATTERN).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <GuideCode key={index}>{part.slice(1, -1)}</GuideCode>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export type GuideRichTextProps = {
  text: string;
};
