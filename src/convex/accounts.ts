import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib";

export const listAccounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const listTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 150);
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const names = new Map(accounts.map((a) => [a._id, a.name]));
    return transactions.map((t) => ({
      ...t,
      accountName: names.get(t.accountId) ?? "—",
    }));
  },
});

export const createAccount = mutation({
  args: {
    name: v.string(),
    kind: v.union(v.literal("cash"), v.literal("bank")),
    openingBalance: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (!args.name.trim()) throw new Error("Nama akun wajib diisi");
    if (args.openingBalance < 0) throw new Error("Saldo awal tidak boleh negatif");
    const accountId = await ctx.db.insert("accounts", {
      userId,
      name: args.name.trim(),
      kind: args.kind,
      balance: args.openingBalance,
      active: true,
    });
    if (args.openingBalance > 0) {
      await ctx.db.insert("transactions", {
        userId,
        accountId,
        direction: "in",
        amount: args.openingBalance,
        category: "Modal awal",
        date: Date.now(),
        source: "opening",
      });
    }
    return accountId;
  },
});

export const addTransaction = mutation({
  args: {
    accountId: v.id("accounts"),
    direction: v.union(v.literal("in"), v.literal("out")),
    amount: v.number(),
    category: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (args.amount <= 0) throw new Error("Jumlah harus lebih dari 0");
    const account = await ctx.db.get(args.accountId);
    if (!account || account.userId !== userId)
      throw new Error("Akun tidak ditemukan");
    if (args.direction === "out" && account.balance < args.amount)
      throw new Error(`Saldo ${account.name} tidak mencukupi`);
    await ctx.db.insert("transactions", {
      userId,
      accountId: args.accountId,
      direction: args.direction,
      amount: args.amount,
      category: args.category.trim() || (args.direction === "in" ? "Pemasukan" : "Pengeluaran"),
      note: args.note?.trim() || undefined,
      date: Date.now(),
      source: "manual",
    });
    await ctx.db.patch(args.accountId, {
      balance:
        account.balance +
        (args.direction === "in" ? args.amount : -args.amount),
    });
  },
});

export const removeTransaction = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const tx = await ctx.db.get(args.id);
    if (!tx || tx.userId !== userId) throw new Error("Mutasi tidak ditemukan");
    if (tx.source !== "manual")
      throw new Error("Hanya mutasi manual yang dapat dihapus");
    const account = await ctx.db.get(tx.accountId);
    if (account) {
      const next =
        account.balance + (tx.direction === "in" ? -tx.amount : tx.amount);
      if (next < 0) throw new Error("Saldo akun menjadi negatif");
      await ctx.db.patch(tx.accountId, { balance: next });
    }
    await ctx.db.delete(args.id);
  },
});
