#!/usr/bin/env node
// Compare two sanitized capture CSV files and print a JSON report.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { compareCaptureCsvs } from "./capture-diff.mjs";

export async function main(args = process.argv.slice(2), io = process) {
  if (args.length !== 2 || args.some(value => !value || value.startsWith("-"))) {
    io.stderr.write("Usage: node server/capture-diff-cli.mjs <baseline.csv> <comparison.csv>\n");
    return 2;
  }
  try {
    const [baseline, comparison] = await Promise.all(args.map(path => readFile(resolve(path), "utf8")));
    const report = compareCaptureCsvs(baseline, comparison);
    io.stdout.write(JSON.stringify(report, null, 2) + "\n");
    return 0;
  } catch (error) {
    io.stderr.write(\`Capture comparison failed: \${error.message}\n\`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await main();
}
