import { describe, expect, it } from 'vitest';
import { ContextMenuTargetHolder } from 'extension/common/state/context-menu-target-holder';
import { StateHolder } from 'extension/common/state/state-holder';

describe('StateHolder', () => {
  it('starts empty', () => {
    const holder = new StateHolder<string>();

    expect(holder.isEmpty()).toBe(true);
    expect(holder.get()).toBeNull();
  });

  it('holds a value once set', () => {
    const holder = new StateHolder<string>();

    holder.set('value');

    expect(holder.isEmpty()).toBe(false);
    expect(holder.get()).toBe('value');
  });

  it('clears a held value', () => {
    const holder = new StateHolder<string>();
    holder.set('value');

    holder.clear();

    expect(holder.isEmpty()).toBe(true);
    expect(holder.get()).toBeNull();
  });

  it('treats a set value as present even when falsy', () => {
    const holder = new StateHolder<number>();

    holder.set(0);

    expect(holder.isEmpty()).toBe(false);
    expect(holder.get()).toBe(0);
  });
});

describe('ContextMenuTargetHolder', () => {
  it('is a StateHolder for elements', () => {
    const holder = new ContextMenuTargetHolder();
    const element = { tagName: 'DIV' } as unknown as Element;

    expect(holder).toBeInstanceOf(StateHolder);
    holder.set(element);
    expect(holder.get()).toBe(element);
  });
});
