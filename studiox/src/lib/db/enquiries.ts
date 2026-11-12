import { and, count, desc, eq, gt } from 'drizzle-orm';
import type { Db } from './client';
import { enquiries } from './schema';
import type { EnquiryInput } from '../cms/enquiry';

export async function saveEnquiry(db: Db, input: EnquiryInput) {
  const [row] = await db.insert(enquiries).values(input).returning({ id: enquiries.id });
  return row.id;
}

/** How many messages this email address sent in the last `minutes` (for rate limiting). */
export async function recentFromEmail(db: Db, email: string, minutes: number, now = new Date()) {
  const since = new Date(now.getTime() - minutes * 60_000);
  const [row] = await db
    .select({ n: count() })
    .from(enquiries)
    .where(and(eq(enquiries.email, email.trim().toLowerCase()), gt(enquiries.createdAt, since)));
  return Number(row?.n ?? 0);
}

export const listEnquiries = (db: Db) => db.select().from(enquiries).orderBy(desc(enquiries.createdAt), desc(enquiries.id));

export async function findEnquiry(db: Db, id: number) {
  const [row] = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
  return row ?? null;
}

export async function setEnquiryRead(db: Db, id: number, read: boolean) {
  await db.update(enquiries).set({ read }).where(eq(enquiries.id, id));
}

export async function unreadEnquiries(db: Db) {
  const [row] = await db.select({ n: count() }).from(enquiries).where(eq(enquiries.read, false));
  return Number(row?.n ?? 0);
}
