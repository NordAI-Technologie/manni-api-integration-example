import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("browser code never loads/persists/sends API credentials", () => {
  for (const file of [
    "src/app/services/api-client.ts",
    "src/app/services/transcriptionApi.ts",
    "src/app/components/ApiConfigProvider.tsx",
    "src/app/components/ApiConfigForm.tsx",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(
      source,
      /NEXT_PUBLIC_API_KEY|x-api-key|x-api-endpoint|localStorage\.setItem|localStorage\.getItem/,
    );
  }
  assert.match(
    readFileSync("src/app/components/ApiConfigProvider.tsx", "utf8"),
    /localStorage\.removeItem\(["']apiConfig["']\)/,
  );
});
