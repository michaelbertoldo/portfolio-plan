import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return [".ts", ".tsx"].includes(extname(path)) &&
      !path.endsWith("sourceSafety.test.ts")
      ? [path]
      : [];
  });
}

describe("frontend source boundary", () => {
  it("does not import broker or order-submission modules", () => {
    const importLines = sourceFiles(join(process.cwd(), "src"))
      .flatMap((file) => readFileSync(file, "utf8").split("\n"))
      .filter((line) => /^\s*import\b|\bfrom\s+["']/.test(line));
    const imports = importLines.join("\n").toLowerCase();
    expect(imports).not.toContain("phase2_broker");
    expect(imports).not.toContain("order_submission");
    expect(imports).not.toContain("alpaca_client");
    expect(imports).not.toContain("operations.db");
  });
});
