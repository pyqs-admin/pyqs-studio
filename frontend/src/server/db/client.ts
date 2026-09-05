import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/server/config/env";

const globalForDb = globalThis as unknown as { studioPgPool?: Pool };

const pool =
  globalForDb.studioPgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });

if (env.NODE_ENV !== "production") {
  globalForDb.studioPgPool = pool;
}

pool.on("error", (error) => {
  console.error("Unexpected Studio database pool error:", error);
});

export const db = drizzle({ client: pool });

export async function checkDbConnection(): Promise<void> {
  await pool.query("select 1");
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
