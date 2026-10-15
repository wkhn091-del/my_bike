import "server-only";
import { pool } from "./pool";

function db() {
  if (!pool) throw new Error("Database is not configured");
  return pool;
}

export type FeedbackRecipient = { id: string; full_name: string; email: string };

/**
 * Claims paid orders that were never asked, and marks them in the same statement, so two
 * overlapping cron runs can never email the same order twice.
 */
export async function claimFeedbackRecipients(limit: number): Promise<FeedbackRecipient[]> {
  const { rows } = await db().query<FeedbackRecipient>(
    `update orders set feedback_requested_at = now()
     where id in (
       select id from orders
       where status = 'paid' and feedback_requested_at is null
       order by paid_at
       limit $1
       for update skip locked
     )
     returning id, full_name, email`,
    [limit],
  );
  return rows;
}

export type FeedbackOrder = { id: string; status: string; full_name: string; requested: boolean; answered: boolean };

export async function getFeedbackOrder(orderId: string): Promise<FeedbackOrder | null> {
  const { rows } = await db().query<FeedbackOrder>(
    `select o.id, o.status, o.full_name,
            o.feedback_requested_at is not null as requested,
            exists(select 1 from feedback f where f.order_id = o.id) as answered
     from orders o where o.id = $1`,
    [orderId],
  );
  return rows[0] ?? null;
}

/** One answer per order: a second submit is ignored and returns false. */
export async function insertFeedback(orderId: string, rating: number, message: string, publishConsent: boolean): Promise<boolean> {
  const { rowCount } = await db().query(
    `insert into feedback (order_id, rating, message, publish_consent) values ($1, $2, $3, $4)
     on conflict (order_id) do nothing`,
    [orderId, rating, message, publishConsent],
  );
  return rowCount === 1;
}
