/**
 * Ejecuta un archivo .sql con la CLI de InsForge.
 *
 * En Windows, npx.cmd + execFileSync da EINVAL; además cmd trata `@insforge/cli` mal.
 * Aquí se llama: node node_modules/@insforge/cli/dist/index.js db query "<sql>"
 *
 * Uso (desde la raíz del repo):
 *   node scripts/run-insforge-sql.mjs scripts/fix-user-profiles-rls-recursion.sql
 *   npm run db:fix-user-profiles-rls
 */
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");

const file = process.argv[2];
if (!file) {
  console.error("Uso: node scripts/run-insforge-sql.mjs <ruta/al/archivo.sql>");
  process.exit(1);
}

const sqlPath = resolve(root, file);
let sql = readFileSync(sqlPath, "utf8");
if (sql.charCodeAt(0) === 0xfeff) {
  sql = sql.slice(1);
}

const cliJs = resolve(root, "node_modules/@insforge/cli/dist/index.js");
if (!existsSync(cliJs)) {
  console.error(
    "Falta @insforge/cli. Instálala en el proyecto: npm install -D @insforge/cli",
  );
  process.exit(1);
}

try {
  execFileSync(process.execPath, [cliJs, "db", "query", sql], {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });
} catch (e) {
  const status =
    e && typeof e === "object" && "status" in e && typeof e.status === "number"
      ? e.status
      : 1;
  process.exit(status);
}
