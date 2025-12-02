import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);

async function dropAllTables() {
  console.log("Dropping all tables and types...");

  // Drop all tables
  await sql`DROP TABLE IF EXISTS likes CASCADE`;
  await sql`DROP TABLE IF EXISTS comments CASCADE`;
  await sql`DROP TABLE IF EXISTS follows CASCADE`;
  await sql`DROP TABLE IF EXISTS purchases CASCADE`;
  await sql`DROP TABLE IF EXISTS tips CASCADE`;
  await sql`DROP TABLE IF EXISTS subscriptions CASCADE`;
  await sql`DROP TABLE IF EXISTS subscription_plans CASCADE`;
  await sql`DROP TABLE IF EXISTS posts CASCADE`;
  await sql`DROP TABLE IF EXISTS creators CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;

  // Drop old camelCase tables if they exist
  await sql`DROP TABLE IF EXISTS "subscriptionPlans" CASCADE`;
  await sql`DROP TABLE IF EXISTS products CASCADE`;

  // Drop enums
  await sql`DROP TYPE IF EXISTS role CASCADE`;
  await sql`DROP TYPE IF EXISTS post_type CASCADE`;
  await sql`DROP TYPE IF EXISTS subscription_status CASCADE`;
  await sql`DROP TYPE IF EXISTS type CASCADE`;
  await sql`DROP TYPE IF EXISTS status CASCADE`;

  // Drop migration table
  await sql`DROP TABLE IF EXISTS __drizzle_migrations CASCADE`;

  console.log("Done! All tables dropped.");
}

dropAllTables().catch(console.error);
