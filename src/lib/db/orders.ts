import "server-only";
import type { PoolClient } from "pg";
import type { Quote } from "@/lib/pricing/calculate";
import { pool, withSeatLock } from "./pool";

export const HOLD_MINUTES = 15;

/** A seat is taken when it is paid, or held by a checkout that has not timed out yet. */
const TAKEN = `(status = 'paid' or (status = 'held' and hold_expires_at > now()))`;

export type RidingLevel = "beginner" | "intermediate" | "advanced";

export type OrderRow = {
  id: string;
  status: "held" | "paid" | "cancelled" | "refunded";
  quantity: number;
  early_tickets: number;
  amount_agorot: number;
  discount_kind: Quote["discount"];
  coupon_code: string | null;
  pricing: Quote;
  full_name: string;
  phone: string;
  email: string;
  riding_level: RidingLevel;
  marketing_opt_in: boolean;
  wall_opt_in: boolean;
  hold_expires_at: Date;
  cardcom_low_profile_id: string | null;
  cardcom_transaction_id: string | null;
  paid_at: Date | null;
  seat_start: number | null;
  bike_type: string | null;
  details_submitted_at: Date | null;
};

type Queryable = Pick<PoolClient, "query">;

function db(): Queryable {
  if (!pool) throw new Error("Database is not configured");
  return pool;
}

export async function readAvailability(
  client: Queryable,
  capacity: number,
  earlySeats: number,
  excludeOrderId: string | null = null,
): Promise<{ taken: number; seatsLeft: number; earlySeatsLeft: number }> {
  const { rows } = await client.query<{ taken: string; early_taken: string }>(
    `select coalesce(sum(quantity) filter (where ${TAKEN}), 0) as taken,
            coalesce(sum(early_tickets) filter (where ${TAKEN}), 0) as early_taken
       from orders
      where $1::uuid is null or id <> $1::uuid`,
    [excludeOrderId],
  );
  const taken = Number(rows[0]?.taken ?? 0);
  const earlyTaken = Number(rows[0]?.early_taken ?? 0);
  return {
    taken,
    seatsLeft: Math.max(0, capacity - taken),
    earlySeatsLeft: Math.max(0, earlySeats - earlyTaken),
  };
}

export async function countCouponUses(client: Queryable, code: string): Promise<number> {
  const { rows } = await client.query<{ uses: string }>(
    `select count(*) as uses from orders where coupon_code = $1 and ${TAKEN}`,
    [code],
  );
  return Number(rows[0]?.uses ?? 0);
}

export type NewOrder = {
  id: string;
  quote: Quote;
  fullName: string;
  phone: string;
  email: string;
  ridingLevel: RidingLevel;
  marketingOptIn: boolean;
  wallOptIn: boolean;
};

export async function insertHeldOrder(client: Queryable, order: NewOrder): Promise<void> {
  await client.query(
    `insert into orders (id, status, quantity, early_tickets, amount_agorot, discount_kind, coupon_code, pricing,
                         full_name, phone, email, riding_level, marketing_opt_in, wall_opt_in, hold_expires_at)
     values ($1, 'held', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now() + make_interval(mins => $14))`,
    [
      order.id,
      order.quote.quantity,
      order.quote.earlyTickets,
      order.quote.totalAgorot,
      order.quote.discount,
      order.quote.couponCode,
      JSON.stringify(order.quote),
      order.fullName,
      order.phone,
      order.email,
      order.ridingLevel,
      order.marketingOptIn,
      order.wallOptIn,
      HOLD_MINUTES,
    ],
  );
}

/** Releases a hold the buyer abandoned (retry after a failed payment, or Cardcom refused to open a page). */
export async function cancelHeldOrder(client: Queryable, id: string): Promise<void> {
  await client.query(`update orders set status = 'cancelled' where id = $1 and status = 'held'`, [id]);
}

export async function attachLowProfile(id: string, lowProfileId: string): Promise<void> {
  await db().query(`update orders set cardcom_low_profile_id = $2 where id = $1 and status = 'held'`, [id, lowProfileId]);
}

export async function getOrder(id: string): Promise<OrderRow | null> {
  const { rows } = await db().query<OrderRow>(`select * from orders where id = $1`, [id]);
  return rows[0] ?? null;
}

/** Used by the Cardcom webhook so unknown LowProfileIds never trigger an outbound API call. */
export async function getOrderByLowProfileId(lowProfileId: string): Promise<OrderRow | null> {
  const { rows } = await db().query<OrderRow>(`select * from orders where cardcom_low_profile_id = $1 limit 1`, [lowProfileId]);
  return rows[0] ?? null;
}

export type PaidTransition = { order: OrderRow; transitioned: boolean; heldExpired: boolean };

/**
 * Idempotent: Cardcom retries its webhook up to 7 times and the buyer's redirect can race it.
 * Only the first call flips the status and assigns seat numbers; later calls return `transitioned: false`.
 * A payment that lands after its hold expired is still honoured (the card was charged) and flagged.
 */
export async function markOrderPaid(id: string, transactionId: number | null): Promise<PaidTransition | null> {
  return withSeatLock(async (client) => {
    const { rows } = await client.query<OrderRow>(`select * from orders where id = $1 for update`, [id]);
    const order = rows[0];
    if (!order) return null;
    if (order.status === "paid" || order.status === "refunded") return { order, transitioned: false, heldExpired: false };

    const heldExpired = order.status === "cancelled" || order.hold_expires_at.getTime() < Date.now();
    const { rows: seatRows } = await client.query<{ next_seat: string }>(
      `select coalesce(max(seat_start + quantity - 1), 0) + 1 as next_seat from orders where status = 'paid'`,
    );
    const seatStart = Number(seatRows[0]?.next_seat ?? 1);
    const { rows: updated } = await client.query<OrderRow>(
      `update orders set status = 'paid', paid_at = now(), seat_start = $2, cardcom_transaction_id = $3
        where id = $1 returning *`,
      [id, seatStart, transactionId],
    );
    return { order: updated[0], transitioned: true, heldExpired };
  });
}

export type WallSeat = { seat: number; label: string | null };

/** Public data only: a count, plus "first name + initial" for buyers who ticked the wall box. */
export async function readWall(): Promise<{ taken: number; named: WallSeat[] }> {
  const { rows } = await db().query<{ seat_start: number | null; quantity: number; wall_opt_in: boolean; full_name: string; status: string }>(
    `select seat_start, quantity, wall_opt_in, full_name, status from orders where ${TAKEN} order by seat_start nulls last`,
  );
  let taken = 0;
  const named: WallSeat[] = [];
  for (const row of rows) {
    taken += row.quantity;
    if (row.status === "paid" && row.wall_opt_in && row.seat_start) {
      named.push({ seat: row.seat_start, label: wallLabel(row.full_name) });
    }
  }
  return { taken, named };
}

export function wallLabel(fullName: string): string {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0]}.` : first;
}

export type ParticipantInput = {
  position: number;
  fullName: string;
  phone: string | null;
  birthDate: string;
  parent: { name: string; phone: string; email: string } | null;
};

export async function saveOrderDetails(orderId: string, bikeType: string, participants: ParticipantInput[]): Promise<Array<{ id: string; position: number }>> {
  if (!pool) throw new Error("Database is not configured");
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`update orders set bike_type = $2, details_submitted_at = now() where id = $1 and status = 'paid'`, [orderId, bikeType]);
    const saved: Array<{ id: string; position: number }> = [];
    for (const p of participants) {
      const { rows } = await client.query<{ id: string }>(
        `insert into participants (order_id, position, full_name, phone, birth_date, parent_name, parent_phone, parent_email)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (order_id, position) do update
           set full_name = excluded.full_name, phone = excluded.phone, birth_date = excluded.birth_date,
               parent_name = excluded.parent_name, parent_phone = excluded.parent_phone, parent_email = excluded.parent_email,
               parent_consent_at = case when participants.parent_email is distinct from excluded.parent_email
                                        then null else participants.parent_consent_at end
         returning id`,
        [orderId, p.position, p.fullName, p.phone, p.birthDate, p.parent?.name ?? null, p.parent?.phone ?? null, p.parent?.email ?? null],
      );
      saved.push({ id: rows[0].id, position: p.position });
    }
    await client.query("commit");
    return saved;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export type ParticipantRow = {
  position: number;
  full_name: string;
  phone: string | null;
  /** YYYY-MM-DD (see the DATE parser in pool.ts). */
  birth_date: string;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  parent_consent_at: Date | null;
};

export async function getParticipants(orderId: string): Promise<ParticipantRow[]> {
  const { rows } = await db().query<ParticipantRow>(
    `select position, full_name, phone, birth_date, parent_name, parent_phone, parent_email, parent_consent_at
       from participants where order_id = $1 order by position`,
    [orderId],
  );
  return rows;
}

export type ConsentRow = {
  id: string;
  full_name: string;
  birth_date: string;
  parent_name: string | null;
  parent_consent_at: Date | null;
  order_status: string;
};

export async function getParticipantForConsent(id: string): Promise<ConsentRow | null> {
  const { rows } = await db().query<ConsentRow>(
    `select p.id, p.full_name, p.birth_date, p.parent_name, p.parent_consent_at, o.status as order_status
       from participants p join orders o on o.id = p.order_id
      where p.id = $1 and p.parent_email is not null`,
    [id],
  );
  return rows[0] ?? null;
}

/** Single use: a consent already given is never overwritten. */
export async function recordParentConsent(id: string, signedName: string): Promise<boolean> {
  const { rowCount } = await db().query(
    `update participants set parent_consent_at = now(), parent_signed_name = $2
      where id = $1 and parent_consent_at is null and parent_email is not null`,
    [id, signedName],
  );
  return rowCount === 1;
}

export async function insertCoachingLead(fullName: string, phone: string, marketingOptIn: boolean, source: "home" | "thank_you"): Promise<void> {
  await db().query(`insert into coaching_leads (full_name, phone, marketing_opt_in, source) values ($1, $2, $3, $4)`, [
    fullName,
    phone,
    marketingOptIn,
    source,
  ]);
}

export async function insertWaitlist(fullName: string, phone: string, email: string, quantity: number): Promise<void> {
  await db().query(`insert into waitlist (full_name, phone, email, quantity) values ($1, $2, $3, $4)`, [fullName, phone, email, quantity]);
}
