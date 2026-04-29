# @drakulavich/markdownv2-cli

A small Bun + TypeScript CLI that converts Markdown into the [Telegram MarkdownV2](https://core.telegram.org/bots/api#markdownv2-style) format using [`telegramify-markdown`](https://www.npmjs.com/package/telegramify-markdown).

It accepts input as a direct string argument, a `.md` file, or piped stdin, and prints the converted text to stdout.

## Install

This package targets [Bun](https://bun.sh/).

```bash
# In a Bun project
bun add @drakulavich/markdownv2-cli

# Or globally
bun add -g @drakulavich/markdownv2-cli
```

## Usage

```bash
markdownv2 [options] [text]
markdownv2 --file <path>
cat file.md | markdownv2
```

### Options

| Option | Description |
| --- | --- |
| `-f, --file <path>` | Read Markdown from a file. |
| `-s, --strategy <mode>` | Strategy for unsupported tags: `escape`, `remove`, or `keep`. Default: `escape`. |
| `-h, --help` | Show usage and exit. |
| `-v, --version` | Print version and exit. |

### Examples

```bash
# Inline text
markdownv2 "**hello** _world_"

# Read a file
markdownv2 --file README.md

# Read from stdin
cat notes.md | markdownv2

# Remove unsupported tags entirely
markdownv2 -s remove --file README.md
```

## Development

```bash
bun install
bun run typecheck
bun test
bun run start -- "**hello**"
bun run build
```

The build emits a single bundle to `dist/cli.js`, which is what the `markdownv2` bin points at.

## Notes on `telegramify-markdown`

- The library exports a single function: `convert(markdown, strategy)`.
- The `strategy` argument controls how markdown nodes Telegram does not support are handled:
  - `escape` (this CLI's default) — escape the unsupported syntax so it shows as plain text.
  - `remove` — drop unsupported nodes entirely.
  - `keep` — leave them as-is (the library's own default).
- Telegram's MarkdownV2 has a fixed set of supported entities (bold, italic, underline, strikethrough, spoiler, inline code, code block, link, blockquote). Anything outside that set has to be escaped or removed.

## Publishing (maintainers)

Releases are published to npm via the `Publish to npm` GitHub Actions workflow (`.github/workflows/publish.yml`). The workflow runs on manual `workflow_dispatch` and on GitHub release creation. It requires an `NPM_TOKEN` repository secret with publish rights to `@drakulavich/markdownv2-cli`.

To cut a release:

1. Bump `version` in `package.json` and merge to `main`.
2. Either create a GitHub release for the new tag, or trigger the workflow manually from the Actions tab.

The workflow runs `bun install --frozen-lockfile`, `bun run typecheck`, `bun test`, `bun run build`, then `npm publish --access public`.

## License

MIT
