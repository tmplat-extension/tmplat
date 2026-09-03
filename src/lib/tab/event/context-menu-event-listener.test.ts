import { describe, expect, it, vi } from 'vitest';
import { ContextMenuTargetHolder } from 'extension/common/state/context-menu-target-holder';
import { ContextMenuEventListener } from 'extension/tab/event/context-menu-event-listener';

type Handler = (event: unknown) => void;

const install = () => {
  const windowListeners = new Map<string, Handler>();
  const documentListeners = new Map<string, Handler>();

  vi.stubGlobal(
    'addEventListener',
    vi.fn((type: string, handler: Handler) => windowListeners.set(type, handler)),
  );
  vi.stubGlobal('document', {
    addEventListener: vi.fn((type: string, handler: Handler) => documentListeners.set(type, handler)),
  });

  return { documentListeners, windowListeners };
};

describe('ContextMenuEventListener', () => {
  it('registers contextmenu and blur on the window and click on the document', () => {
    const { documentListeners, windowListeners } = install();

    new ContextMenuEventListener(new ContextMenuTargetHolder()).listen();

    expect([...windowListeners.keys()]).toEqual(expect.arrayContaining(['contextmenu', 'blur']));
    expect([...documentListeners.keys()]).toEqual(['click']);
  });

  it('stores the contextmenu target element', () => {
    const { windowListeners } = install();
    const holder = new ContextMenuTargetHolder();
    new ContextMenuEventListener(holder).listen();
    const element = { nodeName: 'A' } as unknown as Element;

    windowListeners.get('contextmenu')!({ target: element });

    expect(holder.get()).toBe(element);
  });

  it('clears the stored target when the contextmenu event has no target', () => {
    const { windowListeners } = install();
    const holder = new ContextMenuTargetHolder();
    holder.set({} as Element);
    new ContextMenuEventListener(holder).listen();

    windowListeners.get('contextmenu')!({ target: null });

    expect(holder.get()).toBeNull();
  });

  it.each([
    ['blur', 'window'],
    ['click', 'document'],
  ])('clears the stored target on %s', (type, scope) => {
    const { documentListeners, windowListeners } = install();
    const holder = new ContextMenuTargetHolder();
    holder.set({} as Element);
    new ContextMenuEventListener(holder).listen();

    const handler = scope === 'window' ? windowListeners.get(type) : documentListeners.get(type);
    handler!({});

    expect(holder.get()).toBeNull();
  });
});
