declare module "telegramify-markdown" {
  type UnsupportedTagsStrategy = "escape" | "remove" | "keep";
  function convert(
    markdown: string,
    unsupportedTagsStrategy?: UnsupportedTagsStrategy,
  ): string;
  export default convert;
}
