import { describe, expect, test } from "bun:test";
import { spawn } from "bun";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI = new URL("../src/cli.ts", import.meta.url).pathname;

async function runCli(args: string[], stdin?: string) {
  const proc = spawn({
    cmd: ["bun", "run", CLI, ...args],
    stdin: stdin === undefined ? "ignore" : "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  if (stdin !== undefined && proc.stdin) {
    proc.stdin.write(stdin);
    proc.stdin.end();
  }
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout, stderr, exitCode };
}

describe("cli", () => {
  test("--version prints version", async () => {
    const { stdout, exitCode } = await runCli(["--version"]);
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  test("--help prints usage", async () => {
    const { stdout, exitCode } = await runCli(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("--file");
  });

  test("converts inline text argument", async () => {
    const { stdout, exitCode } = await runCli(["**hello**"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("*hello*");
  });

  test("reads from --file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mdv2-"));
    const file = join(dir, "sample.md");
    writeFileSync(file, "# Title\n\nHello!\n");
    const { stdout, exitCode } = await runCli(["--file", file]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("*Title*");
    expect(stdout).toContain("\\!");
  });

  test("missing file errors with non-zero exit", async () => {
    const { stderr, exitCode } = await runCli(["--file", "/no/such/file.md"]);
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("failed to read file");
  });

  test("unknown option errors", async () => {
    const { stderr, exitCode } = await runCli(["--nope"]);
    expect(exitCode).toBe(2);
    expect(stderr).toContain("Unknown option");
  });

  test("reads from stdin when piped", async () => {
    const { stdout, exitCode } = await runCli([], "**piped**\n");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("*piped*");
  });

  test("invalid strategy errors", async () => {
    const { stderr, exitCode } = await runCli(["-s", "bogus", "hi"]);
    expect(exitCode).toBe(2);
    expect(stderr).toContain("Invalid strategy");
  });
});
