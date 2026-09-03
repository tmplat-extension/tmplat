import { injectable } from 'extension/common/di';

export const TemplateIdGeneratorToken = Symbol('TemplateIdGenerator');

@injectable()
export class TemplateIdGenerator {
  generate(exclusions?: ReadonlySet<string>): string {
    if (!exclusions) {
      return crypto.randomUUID();
    }

    let id: string;
    do {
      id = crypto.randomUUID();
    } while (exclusions.has(id));
    return id;
  }
}
