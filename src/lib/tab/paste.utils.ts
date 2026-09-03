/**
 * The element types auto-paste supports.
 *
 * `contenteditable` elements are deliberately excluded. Chrome reports them as editable contexts (so
 * `OnClickData.editable` is `true` for them), but they have no `value`/`selectionStart`, so the caret-preserving
 * splice below cannot be applied to one.
 */
export type PasteTarget = HTMLInputElement | HTMLTextAreaElement;

/**
 * Resolve `target` to an element auto-paste can write into, if it is one.
 */
export const getPasteTarget = (target: EventTarget | Element | null | undefined): PasteTarget | undefined => {
  if (!target) {
    return;
  }

  switch ((target as Element).nodeName) {
    case 'INPUT':
      // Deliberately not filtered by `type`: `paste` rejects anything whose `selectionStart` is `null`, which per
      // spec is every type except text/search/url/tel/password (notably including email and number). That is read
      // from the DOM rather than hardcoded here, so it cannot drift as new input types are added.
      return target as HTMLInputElement;
    case 'TEXTAREA':
      return target as HTMLTextAreaElement;
    default:
      return;
  }
};

/**
 * Insert `value` into `element` at its caret, replacing any selected text.
 *
 * This simulates a paste rather than replacing the element's value outright, so it must splice around the current
 * selection. Returns whether anything was written, so a caller can tell an ignored paste from a completed one.
 */
export const paste = (element: PasteTarget, value: string): boolean => {
  if (element.selectionStart == null || element.selectionEnd == null) {
    // Input element is not text-based (e.g. checkbox)
    return false;
  }
  if (!isEditable(element)) {
    return false;
  }

  let buffer = element.value.substring(0, element.selectionStart);
  buffer += value;
  buffer += element.value.substring(element.selectionEnd, element.value.length);

  element.value = buffer;

  return true;
};

const isEditable = (element: PasteTarget): boolean => !(element.disabled || element.readOnly);
