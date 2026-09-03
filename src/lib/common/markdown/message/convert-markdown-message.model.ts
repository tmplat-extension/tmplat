export type ConvertMarkdownMessage = {
  readonly html: string;
  readonly inline: boolean;
};

export type ConvertMarkdownMessageReply = {
  readonly markdown: string;
};
