import { inject, injectable } from 'extension/common/di';
import { EventListener } from 'extension/common/event/event-listener';
import {
  ContextMenuTargetHolder,
  ContextMenuTargetHolderToken,
} from 'extension/common/state/context-menu-target-holder';

// TODO: Is this necessary/used? Can we just deprecate the linkHTML & linkText context entries?
@injectable()
export class ContextMenuEventListener implements EventListener {
  constructor(
    @inject(ContextMenuTargetHolderToken) private readonly contextMenuTargetHolder: ContextMenuTargetHolder,
  ) {}

  listen() {
    addEventListener('contextmenu', this.storeTarget.bind(this));

    addEventListener('blur', this.clearTarget.bind(this));
    document.addEventListener('click', this.clearTarget.bind(this));
  }

  private clearTarget() {
    this.contextMenuTargetHolder.clear();
  }

  private storeTarget({ target }: { target: EventTarget | null }) {
    if (target) {
      this.contextMenuTargetHolder.set(target as Element);
    } else {
      this.contextMenuTargetHolder.clear();
    }
  }
}
