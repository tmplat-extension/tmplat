import { injectable } from 'extension/common/di';

export const MessageIdGeneratorToken = Symbol('MessageIdGenerator');

@injectable()
export class MessageIdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
