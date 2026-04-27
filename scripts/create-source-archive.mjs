import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const releaseDir = join(root, "release");
mkdirSync(releaseDir, { recursive: true });

try {
  execFileSync("git", ["diff", "--quiet"], { cwd: root });
  execFileSync("git", ["diff", "--cached", "--quiet"], { cwd: root });
} catch {
  console.error("Source archive requires a clean git index and working tree.");
  process.exit(1);
}

const timestamp = new Date().toISOString().slice(0, 10);
const archiveName = `pdf-powerhouse-source-${timestamp}.zip`;
const archivePath = join(releaseDir, archiveName);

execFileSync("git", ["archive", "--format=zip", "--output", archivePath, "HEAD"], {
  cwd: root,
  stdio: "inherit",
});

console.log(`Created source archive: ${archivePath}`);
