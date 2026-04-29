import telegramifyMarkdown from "telegramify-markdown";

export type UnsupportedTagsStrategy = "escape" | "remove" | "keep";

export function convertToMarkdownV2(
  markdown: string,
  strategy: UnsupportedTagsStrategy = "escape",
): string {
  return telegramifyMarkdown(markdown, strategy);
}
