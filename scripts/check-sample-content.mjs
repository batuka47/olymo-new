// Fails when a migration would put sample content into the hosted database. Sample articles,
// events, ads and team members belong in supabase/seed.sql, which only runs locally.
// Run with `npm run check:samples` (also part of `npm run lint`).
import { readdirSync, readFileSync } from "node:fs";

const migrationsDir = new URL("../supabase/migrations/", import.meta.url);
const SAMPLE_MARKER = "[ЖИШЭЭ]";
const CONTENT_INSERT = /insert\s+into\s+public\.(articles|events|ads|team_members)\b/i;

const migrations = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const problems = [];
for (const file of migrations) {
  const sql = readFileSync(new URL(file, migrationsDir), "utf8");
  if (sql.includes(SAMPLE_MARKER)) {
    problems.push(`${file}: contains ${SAMPLE_MARKER} sample content`);
  }
  const insert = sql.match(CONTENT_INSERT);
  if (insert) {
    problems.push(`${file}: inserts rows into public.${insert[1]} (put samples in seed.sql)`);
  }
}

if (problems.length > 0) {
  console.error(
    `check:samples: migrations must not carry sample content:\n  ${problems.join("\n  ")}`,
  );
  process.exit(1);
}
console.log("check:samples: no sample content in the migrations.");
