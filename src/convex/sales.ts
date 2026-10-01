import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { dayKey, getSettings, nextSequence, requireUserId } from "./lib";

const paymentMethod = v.union(
  v.literal("cash"),
  v.literal("qris"),
  v.literal("card"),
  v.literal("transfer"),
  v.literal("ewallet"),
);

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("sales")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 100);
  },
});

export const today = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const key = dayKey(Date.now());
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_user_day", (q) =>
        q.eq("userId", userId).eq("dayKey", key),
      )
      .order("desc")
      .collect();
    return sales;
  },
});

export const create = mutation({
  args: {
    items: v.array(
      v.object({ productId: v.id("products"), qty: v.number() }),
    ),
    discount: v.number(),
    paymentMethod,
    amountPaid: v.number(),
    accountId: v.optional(v.id("accounts")),
    contactId: v.optional(v.id("contacts")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (args.items.length === 0) throw new Error("Keranjang masih kosong");
    if (args.discount < 0) throw new Error("Diskon tidak boleh negatif");

    const settings = await getSettings(ctx, userId);
    const taxRate = settings?.taxRate ?? 0;

    const lines: {
      productId: (typeof args.items)[number]["productId"];
      name: string;
      qty: number;
      price: number;
      cost: number;
    }[] = [];

    let subtotal = 0;
    for (const line of args.items) {
      const qty = Math.floor(line.qty);
      if (qty <= 0) throw new Error("Jumlah barang tidak valid");
      const product = await ctx.db.get(line.productId);
      if (!product || product.userId !== userId || !product.active)
        throw new Error("Barang tidak ditemukan");
      if (product.stock < qty)
        throw new Error(
          `Stok ${product.name} tidak cukup (tersisa ${product.stock})`,
        );
      subtotal += product.sellPrice * qty;
      lines.push({
        productId: product._id,
        name: product.name,
        qty,
        price: product.sellPrice,
        cost: product.costPrice,
      });
      await ctx.db.patch(product._id, { stock: product.stock - qty });
    }

    const discount = Math.min(args.discount, subtotal);
    const taxable = subtotal - discount;
    const tax = Math.round((taxable * taxRate) / 100);
    const total = taxable + tax;
    const amountPaid = Math.max(0, args.amountPaid);
    const paid = amountPaid >= total;
    const change = paid ? amountPaid - total : 0;

    const now = Date.now();
    const key = dayKey(now);
    const seq = await nextSequence(ctx, `sale:${userId}:${key}`);
    const number = `INV-${key.replace(/-/g, "")}-${String(seq).padStart(4, "0")}`;

    let accountId = args.accountId ?? null;
    if (accountId) {
      const account = await ctx.db.get(accountId);
      if (!account || account.userId !== userId)
        throw new Error("Akun kas tidak ditemukan");
    } else {
      const cashAccount = (
        await ctx.db
          .query("accounts")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect()
      ).find((a) => a.kind === "cash" && a.active);
      accountId = cashAccount?._id ?? null;
    }

    const saleId = await ctx.db.insert("sales", {
      userId,
      number,
      dayKey: key,
      createdAt: now,
      contactId: args.contactId,
      accountId: accountId ?? undefined,
      items: lines,
      subtotal,
      discount,
      taxRate,
      tax,
      total,
      paymentMethod: args.paymentMethod,
      amountPaid,
      change,
      status: paid ? "paid" : "unpaid",
      note: args.note?.trim() || undefined,
    });

    if (accountId && paid && total > 0) {
      await ctx.db.insert("transactions", {
        userId,
        accountId,
        direction: "in",
        amount: total,
        category: "Penjualan",
        note: number,
        date: now,
        source: "sale",
        sourceId: saleId,
      });
      const account = await ctx.db.get(accountId);
      if (account) {
        await ctx.db.patch(accountId, { balance: account.balance + total });
      }
    }

    return saleId;
  },
});

export const voidSale = mutation({
  args: { id: v.id("sales") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const sale = await ctx.db.get(args.id);
    if (!sale || sale.userId !== userId) throw new Error("Transaksi tidak ditemukan");
    if (sale.status !== "paid") throw new Error("Hanya transaksi lunas yang dapat dibatalkan");
    for (const item of sale.items) {
      const product = await ctx.db.get(item.productId);
      if (product && product.userId === userId) {
        await ctx.db.patch(item.productId, { stock: product.stock + item.qty });
      }
    }
    if (sale.accountId) {
      const account = await ctx.db.get(sale.accountId);
      if (account && account.balance >= sale.total) {
        await ctx.db.patch(sale.accountId, { balance: account.balance - sale.total });
      }
      const tx = await ctx.db
        .query("transactions")
        .withIndex("by_account", (q) => q.eq("accountId", sale.accountId!))
        .order("desc")
        .take(200);
      for (const t of tx) {
        if (t.source === "sale" && t.sourceId === args.id) {
          await ctx.db.delete(t._id);
        }
      }
      return;
    }
    await ctx.db.delete(args.id);
  },
});
