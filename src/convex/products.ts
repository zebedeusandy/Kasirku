import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("products")
      .withIndex("by_user_name", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    sku: v.optional(v.string()),
    category: v.optional(v.string()),
    unit: v.string(),
    costPrice: v.number(),
    sellPrice: v.number(),
    stock: v.number(),
    reorderLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (!args.name.trim()) throw new Error("Nama barang wajib diisi");
    if (args.sellPrice < 0 || args.costPrice < 0)
      throw new Error("Harga tidak boleh negatif");
    return await ctx.db.insert("products", {
      userId,
      name: args.name.trim(),
      sku: args.sku?.trim() || undefined,
      category: args.category?.trim() || undefined,
      unit: args.unit.trim() || "pcs",
      costPrice: args.costPrice,
      sellPrice: args.sellPrice,
      stock: args.stock,
      reorderLevel: args.reorderLevel,
      active: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    sku: v.optional(v.string()),
    category: v.optional(v.string()),
    unit: v.string(),
    costPrice: v.number(),
    sellPrice: v.number(),
    stock: v.number(),
    reorderLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) throw new Error("Barang tidak ditemukan");
    if (!args.name.trim()) throw new Error("Nama barang wajib diisi");
    if (args.sellPrice < 0 || args.costPrice < 0)
      throw new Error("Harga tidak boleh negatif");
    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      sku: args.sku?.trim() || undefined,
      category: args.category?.trim() || undefined,
      unit: args.unit.trim() || "pcs",
      costPrice: args.costPrice,
      sellPrice: args.sellPrice,
      stock: args.stock,
      reorderLevel: args.reorderLevel,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) throw new Error("Barang tidak ditemukan");
    await ctx.db.delete(args.id);
  },
});
