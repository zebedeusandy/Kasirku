import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return assets.sort((a, b) => b.acquiredAt - a.acquiredAt);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    acquiredAt: v.number(),
    cost: v.number(),
    salvageValue: v.number(),
    usefulLifeMonths: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (!args.name.trim()) throw new Error("Nama aset wajib diisi");
    if (args.cost <= 0) throw new Error("Nilai perolehan harus lebih dari 0");
    if (args.usefulLifeMonths <= 0)
      throw new Error("Umur manfaat harus lebih dari 0 bulan");
    if (args.salvageValue < 0 || args.salvageValue > args.cost)
      throw new Error("Nilai sisa tidak valid");
    return await ctx.db.insert("assets", {
      userId,
      name: args.name.trim(),
      category: args.category.trim() || "Lainnya",
      acquiredAt: args.acquiredAt,
      cost: args.cost,
      salvageValue: args.salvageValue,
      usefulLifeMonths: Math.floor(args.usefulLifeMonths),
      note: args.note?.trim() || undefined,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("assets") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) throw new Error("Aset tidak ditemukan");
    await ctx.db.delete(args.id);
  },
});
