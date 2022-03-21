import { Content, ContentToken } from 'extension/content/content';
import { container } from 'extension/content/homepage-content/homepage-content.config';

const content = container.get<Content>(ContentToken);
content.inject();
