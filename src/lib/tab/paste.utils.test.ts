import { describe, expect, it } from 'vitest';
import { getPasteTarget, paste } from 'extension/tab/paste.utils';

type InputOptions = {
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
};

// `Partial<HTMLInputElement>` is too wide for `Object.assign` to represent, so only the properties these tests vary
// are accepted
const createInput = (value = '', { disabled, readOnly, type }: InputOptions = {}) => {
  const input = document.createElement('input');
  if (type != null) {
    input.type = type;
  }
  input.value = value;
  input.disabled = disabled ?? false;
  input.readOnly = readOnly ?? false;

  return input;
};

const createTextArea = (value = '') => {
  const textArea = document.createElement('textarea');
  textArea.value = value;

  return textArea;
};

describe('paste.utils', () => {
  describe('getPasteTarget', () => {
    it('resolves an input element', () => {
      const input = createInput();

      expect(getPasteTarget(input)).toBe(input);
    });

    it('resolves a textarea element', () => {
      const textArea = createTextArea();

      expect(getPasteTarget(textArea)).toBe(textArea);
    });

    it.each([null, undefined])('resolves nothing for %j', (target) => {
      expect(getPasteTarget(target)).toBeUndefined();
    });

    it.each(['div', 'span', 'a', 'button', 'select'])('resolves nothing for a %s element', (tagName) => {
      expect(getPasteTarget(document.createElement(tagName))).toBeUndefined();
    });

    /*
     * Chrome reports a `contenteditable` element as an editable context, so the background worker will happily ask for
     * a paste into one. It has no `value`/`selectionStart`, so it must not be resolved as a target.
     */
    it('resolves nothing for a contenteditable element', () => {
      const element = document.createElement('div');
      element.contentEditable = 'true';

      expect(getPasteTarget(element)).toBeUndefined();
    });
  });

  describe('paste', () => {
    it('inserts the value at the caret rather than replacing the whole value', () => {
      const input = createInput('start end');
      input.setSelectionRange(6, 6);

      expect(paste(input, 'middle ')).toBe(true);
      expect(input.value).toBe('start middle end');
    });

    it('replaces the selected text', () => {
      const input = createInput('keep THIS keep');
      input.setSelectionRange(5, 9);

      expect(paste(input, 'that')).toBe(true);
      expect(input.value).toBe('keep that keep');
    });

    it('appends to an empty element', () => {
      const textArea = createTextArea();

      expect(paste(textArea, 'value')).toBe(true);
      expect(textArea.value).toBe('value');
    });

    it('does not write to a read-only element', () => {
      const input = createInput('original', { readOnly: true });

      expect(paste(input, 'value')).toBe(false);
      expect(input.value).toBe('original');
    });

    it('does not write to a disabled element', () => {
      const input = createInput('original', { disabled: true });

      expect(paste(input, 'value')).toBe(false);
      expect(input.value).toBe('original');
    });

    // A non-text input (checkbox, radio, colour, ...) reports a null selection, so there is no caret to splice around
    it('does not write to an element with no selection range', () => {
      const input = createInput('original', { type: 'checkbox' });

      expect(input.selectionStart).toBeNull();
      expect(paste(input, 'value')).toBe(false);
    });
  });
});
