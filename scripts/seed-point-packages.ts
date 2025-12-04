import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pointPackages } from "../drizzle/schema";

async function seedPointPackages() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  const packages = [
    { name: "500ポイント", points: 500, priceJpy: 500, displayOrder: 1 },
    { name: "1,000ポイント", points: 1000, priceJpy: 1000, displayOrder: 2 },
    { name: "3,000ポイント", points: 3000, priceJpy: 3000, displayOrder: 3 },
    { name: "5,000ポイント", points: 5000, priceJpy: 5000, displayOrder: 4 },
    { name: "10,000ポイント", points: 10000, priceJpy: 10000, displayOrder: 5 },
  ];

  console.log("Seeding point packages...");

  for (const pkg of packages) {
    await db.insert(pointPackages).values(pkg).onConflictDoNothing();
    console.log(`  - ${pkg.name}`);
  }

  console.log("Done!");
}

seedPointPackages().catch(console.error);
