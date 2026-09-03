import { injectable } from 'extension/common/di';
import { StateHolder } from 'extension/common/state/state-holder';

export const ContextMenuTargetHolderToken = Symbol('ContextMenuTargetHolder');

@injectable()
export class ContextMenuTargetHolder extends StateHolder<Element> {}
