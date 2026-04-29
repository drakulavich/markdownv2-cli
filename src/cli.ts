#!/usr/bin/env bun
import { readFile } from "node:fs/promises";
import { convertToMarkdownV2, type UnsupportedTagsStrategy } from "./convert.ts";
import pkg from "../package.json" with { type: "json" };

const HELP_TEXT = `markdownv2 - convert Markdown to Telegram MarkdownV2

Usage:
  markdownv2 [options] [text]
  markdownv2 --file <path>
  cat file.md | markdownv2

Options:
  -f, --file <path>         Read Markdown from a file
  -s, --strategy <mode>     Strategy for unsupported tags: escape | remove | keep
                            (default: escape)
  -h, --help                Show this help and exit
  -v, --version             Print version and exit

Examples:
  markdownv2 "**hello** _world_"
  markdownv2 --file README.md
  cat notes.md | markdownv2
  markdownv2 -s remove --file README.md
`;

interface ParsedArgs {
  help: boolean;
  version: boolean;
  file?: string;
  strategy: UnsupportedTagsStrategy;
  positional: string[];
}

function isStrategy(value: string): value is UnsupportedTagsStrategy {
  return value === "escape" || value === "remove" || value === "keep";
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {
    help: false,
    version: false,
    strategy: "escape",
    positional: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;

    if (arg === "-h" || arg === "--help") {
      out.help = true;
      continue;
    }
    if (arg === "-v" || arg === "--version") {
      out.version = true;
      continue;
    }
    if (arg === "-f" || arg === "--file") {
      const next = argv[i + 1];
      if (next === undefined) {
        throw new UsageError(`Missing path after ${arg}`);
      }
      out.file = next;
      i++;
      continue;
    }
    if (arg.startsWith("--file=")) {
      out.file = arg.slice("--file=".length);
      continue;
    }
    if (arg === "-s" || arg === "--strategy") {
      const next = argv[i + 1];
      if (next === undefined) {
        throw new UsageError(`Missing value after ${arg}`);
      }
      if (!isStrategy(next)) {
        throw new UsageError(
          `Invalid strategy "${next}". Expected one of: escape, remove, keep`,
        );
      }
      out.strategy = next;
      i++;
      continue;
    }
    if (arg.startsWith("--strategy=")) {
      const value = arg.slice("--strategy=".length);
      if (!isStrategy(value)) {
        throw new UsageError(
          `Invalid strategy "${value}". Expected one of: escape, remove, keep`,
        );
      }
      out.strategy = value;
      continue;
    }
    if (arg === "--") {
      out.positional.push(...argv.slice(i + 1));
      break;
    }
    if (arg.startsWith("-") && arg.length > 1) {
      throw new UsageError(`Unknown option: ${arg}`);
    }
    out.positional.push(arg);
  }

  return out;
}

class UsageError extends Error {}

async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  const decoder = new TextDecoder();
  let result = "";
  for await (const chunk of Bun.stdin.stream()) {
    chunks.push(chunk);
  }
  for (const c of chunks) {
    result += decoder.decode(c, { stream: true });
  }
  result += decoder.decode();
  return result;
}

async function main(argv: string[]): Promise<number> {
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(argv);
  } catch (err) {
    if (err instanceof UsageError) {
      process.stderr.write(`error: ${err.message}\n\n${HELP_TEXT}`);
      return 2;
    }
    throw err;
  }

  if (parsed.help) {
    process.stdout.write(HELP_TEXT);
    return 0;
  }
  if (parsed.version) {
    process.stdout.write(`${pkg.version}\n`);
    return 0;
  }

  let input: string;
  const stdinIsTTY = Boolean((process.stdin as { isTTY?: boolean }).isTTY);

  if (parsed.file !== undefined) {
    if (parsed.positional.length > 0) {
      process.stderr.write(
        "error: provide either --file or a text argument, not both\n",
      );
      return 2;
    }
    try {
      input = await readFile(parsed.file, "utf8");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(`error: failed to read file "${parsed.file}": ${msg}\n`);
      return 1;
    }
  } else if (parsed.positional.length > 0) {
    input = parsed.positional.join(" ");
  } else if (!stdinIsTTY) {
    input = await readStdin();
  } else {
    process.stderr.write(
      "error: no input provided\n\n" + HELP_TEXT,
    );
    return 2;
  }

  if (input.length === 0) {
    process.stderr.write("error: input is empty\n");
    return 1;
  }

  try {
    const converted = convertToMarkdownV2(input, parsed.strategy);
    process.stdout.write(converted);
    if (!converted.endsWith("\n")) process.stdout.write("\n");
    return 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`error: conversion failed: ${msg}\n`);
    return 1;
  }
}

const code = await main(process.argv.slice(2));
process.exit(code);
