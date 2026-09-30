// Fails when the category slugs in src/config/categories.ts and the categories rows inserted by
// the Supabase migrations differ. Run with `npm run check:categories` (also part of `npm run lint`).
import { readdirSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const configFile = new URL("src/config/categories.ts", root);
const migrationsDir = new URL("supabase/migrations/", root);

function slugsFromConfig() {
  const source = readFileSync(configFile, "utf8");
  return [...source.matchAll(/\bslug:\s*"([^"]+)"/g)].map((match) => match[1]);
}

function slugsFromMigrations() {
  const insertStatement =
    /insert\s+into\s+public\.categories\s*\(\s*slug\b[^)]*\)\s*values([\s\S]*?);/gi;
  const firstValueOfRow = /\(\s*'([^']+)'/g;
  const migrationFiles = readdirSync(migrationsDir).filter((name) => name.endsWith(".sql"));
  const slugs = [];

  for (const file of migrationFiles.sort()) {
    const sql = readFileSync(new URL(file, migrationsDir), "utf8");
    for (const [, rows] of sql.matchAll(insertStatement)) {
      slugs.push(...[...rows.matchAll(firstValueOfRow)].map((match) => match[1]));
    }
  }
  return slugs;
}

const configSlugs = slugsFromConfig();
const databaseSlugs = slugsFromMigrations();
const onlyInConfig = configSlugs.filter((slug) => !databaseSlugs.includes(slug));
const onlyInDatabase = databaseSlugs.filter((slug) => !configSlugs.includes(slug));

if (configSlugs.length === 0 || databaseSlugs.length === 0) {
  console.error("check:categories: could not find category slugs in one of the sources.");
  process.exit(1);
}

if (onlyInConfig.length > 0 || onlyInDatabase.length > 0) {
  console.error("check:categories: category slugs have drifted.");
  if (onlyInConfig.length > 0) {
    console.error(`  Only in src/config/categories.ts: ${onlyInConfig.join(", ")}`);
    console.error("  → add them with a new migration: insert into public.categories …");
  }
  if (onlyInDatabase.length > 0) {
    console.error(`  Only in supabase/migrations: ${onlyInDatabase.join(", ")}`);
    console.error("  → add them to src/config/categories.ts");
  }
  process.exit(1);
}

console.log(`check:categories: ${configSlugs.length} slugs match (${configSlugs.join(", ")}).`);
