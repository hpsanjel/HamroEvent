import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cgbjdmmhoihusdjaqxlr.supabase.co";
const SUPABASE_KEY = "sb_publishable_0vMAvHuWBJX86e3OnYI1Nw_SLl8wJDH";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function applyMigrations() {
  const migrationsDir = path.join(process.cwd(), "supabase/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${files.length} migration files`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf8");

    console.log(`\n📝 Applying: ${file}`);
    try {
      const { error } = await supabase.from("_migrations").insert({ name: file }).single();
      if (error && !error.message.includes("does not exist")) {
        // Try to execute the SQL
        const { error: execError } = await supabase.rpc("exec_sql", { sql });
        if (execError) {
          console.error(`❌ Error applying ${file}:`, execError);
        } else {
          console.log(`✅ Applied: ${file}`);
        }
      } else {
        console.log(`⏭️  Skipped: ${file} (already applied)`);
      }
    } catch (err) {
      console.error(`❌ Error:`, err.message);
    }
  }
}

applyMigrations().catch(console.error);
