import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getSettings, requireUserId } from "./lib";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await getSettings(ctx, userId);
  },
});

export const upsert = mutation({
  args: {
    storeName: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    receiptFooter: v.optional(v.string()),
    taxRate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (!args.storeName.trim()) throw new Error("Nama toko wajib diisi");
    if (args.taxRate < 0 || args.taxRate > 100)
      throw new Error("Tarif pajak harus 0–100");
    const existing = await getSettings(ctx, userId);
    const patch = {
      storeName: args.storeName.trim(),
      address: args.address?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      receiptFooter: args.receiptFooter?.trim() || undefined,
      taxRate: args.taxRate,
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("settings", { userId, ...patch });
  },
});
