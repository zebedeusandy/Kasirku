import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type Ctx = QueryCtx | MutationCtx;

/** Throws unless the caller is signed in, then returns their user id. */
export async function requireUserId(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Harus masuk terlebih dahulu");
  }
  return userId;
}

/** Day key (Asia/Jakarta, UTC+7) used for per-day receipt numbering and grouping. */
export function dayKey(ts: number): string {
  return new Date(ts + 7 * 3600_000).toISOString().slice(0, 10);
}

/** Next sequence for a key, incremented atomically inside a mutation. */
export async function nextSequence(
  ctx: MutationCtx,
  key: string,
): Promise<number> {
  const counter = await ctx.db
    .query("counters")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (counter) {
    const value = counter.value + 1;
    await ctx.db.patch(counter._id, { value });
    return value;
  }
  await ctx.db.insert("counters", { key, value: 1 });
  return 1;
}

export async function getSettings(ctx: QueryCtx, userId: Id<"users">) {
  return await ctx.db
    .query("settings")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}
