import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { dayKey, nextSequence, requireUserId } from "./lib";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit ?? 100);
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const names = new Map(contacts.map((c) => [c._id, c.name]));
    return purchases.map((p) => ({
      ...p,
      supplierName: p.supplierId ? names.get(p.supplierId) ?? null : null,
    }));
  },
});

export const create = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        qty: v.number(),
        cost: v.number(),
      }),
    ),
    supplierId: v.optional(v.id("contacts")),
    accountId: v.optional(v.id("accounts")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (args.items.length === 0) throw new Error("Daftar barang kosong");

    const lines: {
      productId: (typeof args.items)[number]["productId"];
      name: string;
      qty: number;
      cost: number;
    }[] = [];
    let total = 0;

    for (const line of args.items) {
      const qty = Math.floor(line.qty);
      if (qty <= 0) throw new Error("Jumlah barang tidak valid");
      if (line.cost < 0) throw new Error("Harga beli tidak boleh negatif");
      const product = await ctx.db.get(line.productId);
      if (!product || product.userId !== userId)
        throw new Error("Barang tidak ditemukan");
      total += line.cost * qty;
      lines.push({ productId: product._id, name: product.name, qty, cost: line.cost });
      await ctx.db.patch(product._id, {
        stock: product.stock + qty,
        costPrice: line.cost,
      });
    }

    if (args.supplierId) {
      const supplier = await ctx.db.get(args.supplierId);
      if (!supplier || supplier.userId !== userId)
        throw new Error("Pemasok tidak ditemukan");
    }

    const now = Date.now();
    const key = dayKey(now);
    const seq = await nextSequence(ctx, `purchase:${userId}:${key}`);
    const number = `PO-${key.replace(/-/g, "")}-${String(seq).padStart(4, "0")}`;

    let paid = false;
    let accountId: (typeof args.accountId) | null = args.accountId ?? null;
    if (accountId) {
      const account = await ctx.db.get(accountId);
      if (!account || account.userId !== userId)
        throw new Error("Akun kas tidak ditemukan");
      if (account.balance < total)
        throw new Error(`Saldo ${account.name} tidak mencukupi`);
      paid = true;
    }

    const purchaseId = await ctx.db.insert("purchases", {
      userId,
      number,
      dayKey: key,
      createdAt: now,
      supplierId: args.supplierId,
      accountId: accountId ?? undefined,
      items: lines,
      total,
      paid,
      note: args.note?.trim() || undefined,
    });

    if (accountId && paid) {
      await ctx.db.insert("transactions", {
        userId,
        accountId,
        direction: "out",
        amount: total,
        category: "Pembelian",
        note: number,
        date: now,
        source: "purchase",
        sourceId: purchaseId,
      });
      const account = await ctx.db.get(accountId);
      if (account) {
        await ctx.db.patch(accountId, { balance: account.balance - total });
      }
    }

    return purchaseId;
  },
});
