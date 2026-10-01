import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib";

const kind = v.union(
  v.literal("customer"),
  v.literal("supplier"),
  v.literal("both"),
);

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return contacts.sort((a, b) => a.name.localeCompare(b.name, "id"));
  },
});

export const create = mutation({
  args: {
    kind,
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (!args.name.trim()) throw new Error("Nama kontak wajib diisi");
    return await ctx.db.insert("contacts", {
      userId,
      kind: args.kind,
      name: args.name.trim(),
      phone: args.phone?.trim() || undefined,
      email: args.email?.trim() || undefined,
      address: args.address?.trim() || undefined,
      note: args.note?.trim() || undefined,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    kind,
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId)
      throw new Error("Kontak tidak ditemukan");
    if (!args.name.trim()) throw new Error("Nama kontak wajib diisi");
    await ctx.db.patch(args.id, {
      kind: args.kind,
      name: args.name.trim(),
      phone: args.phone?.trim() || undefined,
      email: args.email?.trim() || undefined,
      address: args.address?.trim() || undefined,
      note: args.note?.trim() || undefined,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId)
      throw new Error("Kontak tidak ditemukan");
    await ctx.db.delete(args.id);
  },
});
