import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);

async function check() {
  // Check columns in creators table
  const columns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'creators'
    ORDER BY ordinal_position
  `;
  console.log("Creators table columns:");
  for (const col of columns) {
    console.log(`  - ${col.column_name}: ${col.data_type}`);
  }

  // Try to get full creator record
  try {
    const creator = await sql`SELECT * FROM creators WHERE username = 'ischca' LIMIT 1`;
    console.log("\nCreator ischca:", creator[0]);
  } catch (e) {
    console.error("Error fetching creator:", e);
  }
}

check().catch(console.error);
