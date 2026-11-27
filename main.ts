// DealLedger hand-in program (Node 22, standard library only).
// Copies the static site (app/) and its screenshots into the output
// directory, then writes dossier.json with the vendored make.fun
// library so the grader sees exactly the site in this repository.
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function copyInto(sourceName: string, targetName: string): void {
  const source = join(repoRoot, sourceName);
  if (!existsSync(source)) return;
  cpSync(source, join(outputDir, targetName), { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyInto("app", "app");
mkdirSync(join(outputDir, "screenshots"), { recursive: true });
copyInto("screenshots", "screenshots");

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outputDir, "dossier.json"), dossier);
console.log("DealLedger dossier written to " + join(outputDir, "dossier.json"));
