import "server-only";
import { Pool, types, type PoolClient } from "pg";
import { serverEnv } from "@/lib/env/server";

// DATE columns stay "YYYY-MM-DD" strings; a JS Date would shift birth dates by the server's timezone.
types.setTypeParser(types.builtins.DATE, (value) => value);

const globalForPool = globalThis as unknown as { rwyPool?: Pool };

function createPool(): Pool | null {
  if (!serverEnv.DATABASE_URL) return null;
  return new Pool({
    connectionString: serverEnv.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 10_000,
  });
}

/** Null when DATABASE_URL is not set (local preview without a database): checkout stays closed. */
export const pool: Pool | null = globalForPool.rwyPool ?? createPool();
if (pool && process.env.NODE_ENV !== "production") globalForPool.rwyPool = pool;

export const hasDatabase = pool !== null;

/** Every change to seats runs under this one lock, so two buyers can never take the 80th seat together. */
const SEAT_LOCK_KEY = 8_080_801;

export async function withSeatLock<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  if (!pool) throw new Error("Database is not configured");
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock($1)", [SEAT_LOCK_KEY]);
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
