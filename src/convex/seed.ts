import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { dayKey, nextSequence, requireUserId } from "./lib";

const PRODUCTS = [
  { name: "Indomie Goreng", category: "Makanan", unit: "pcs", cost: 2700, price: 3500, stock: 48, reorder: 12 },
  { name: "Aqua 600ml", category: "Minuman", unit: "botol", cost: 3000, price: 4000, stock: 36, reorder: 12 },
  { name: "Kopi Kapal Api Sachet", category: "Minuman", unit: "sachet", cost: 1200, price: 2000, stock: 60, reorder: 20 },
  { name: "Roti Tawar", category: "Makanan", unit: "bungkus", cost: 13000, price: 16000, stock: 10, reorder: 4 },
  { name: "Minyak Goreng 1L", category: "Sembako", unit: "liter", cost: 15500, price: 18000, stock: 14, reorder: 6 },
  { name: "Beras 1kg", category: "Sembako", unit: "kg", cost: 13500, price: 15500, stock: 25, reorder: 10 },
  { name: "Gula Pasir 1kg", category: "Sembako", unit: "kg", cost: 14500, price: 17000, stock: 3, reorder: 6 },
  { name: "Telur 1kg", category: "Sembako", unit: "kg", cost: 26000, price: 30000, stock: 8, reorder: 5 },
  { name: "Sabun Mandi", category: "Kebersihan", unit: "pcs", cost: 3800, price: 5000, stock: 20, reorder: 8 },
  { name: "Shampo Sachet", category: "Kebersihan", unit: "sachet", cost: 700, price: 1000, stock: 80, reorder: 30 },
  { name: "Teh Pucuk 350ml", category: "Minuman", unit: "botol", cost: 4000, price: 5000, stock: 24, reorder: 10 },
  { name: "Keripik Kentang 68g", category: "Snack", unit: "pcs", cost: 9500, price: 12000, stock: 2, reorder: 6 },
  { name: "Susu UHT 250ml", category: "Minuman", unit: "kotak", cost: 5500, price: 7000, stock: 18, reorder: 8 },
  { name: "Pepsodent 75g", category: "Kebersihan", unit: "pcs", cost: 8500, price: 11000, stock: 0, reorder: 4 },
];

const CONTACTS = [
  { kind: "customer" as const, name: "Bu Sari", phone: "0812-0000-1111", address: "Jl. Melati 4" },
  { kind: "customer" as const, name: "Pak Hendra", phone: "0813-2222-3333", address: "Jl. Kenanga 9" },
  { kind: "supplier" as const, name: "CV Sumber Pangan", phone: "021-5550-1234", address: "Pasar Pusat Blok C" },
];

/** Deterministic pseudo-random so demo data is stable per seed run. */
function makeRng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

export const demo = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(1);
    if (existing.length > 0) {
      return { seeded: false, reason: "already" as const };
    }

    const productIds: Id<"products">[] = [];
    for (const p of PRODUCTS) {
      const id = await ctx.db.insert("products", {
        userId,
        name: p.name,
        category: p.category,
        unit: p.unit,
        costPrice: p.cost,
        sellPrice: p.price,
        stock: p.stock,
        reorderLevel: p.reorder,
        active: true,
        sku: undefined,
      });
      productIds.push(id);
    }

    const contactIds: Id<"contacts">[] = [];
    for (const c of CONTACTS) {
      const id = await ctx.db.insert("contacts", {
        userId,
        kind: c.kind,
        name: c.name,
        phone: c.phone,
        address: c.address,
      });
      contactIds.push(id);
    }

    const cashId = await ctx.db.insert("accounts", {
      userId,
      name: "Kas Tunai",
      kind: "cash",
      balance: 750000,
      active: true,
    });
    await ctx.db.insert("accounts", {
      userId,
      name: "Bank BCA",
      kind: "bank",
      balance: 3500000,
      active: true,
    });
    await ctx.db.insert("transactions", {
      userId,
      accountId: cashId,
      direction: "in",
      amount: 750000,
      category: "Modal awal",
      date: Date.now() - 10 * 86400_000,
      source: "opening",
    });

    const now = Date.now();
    const rng = makeRng(42);
    const methods = ["cash", "cash", "qris", "cash", "transfer"] as const;

    for (let i = 0; i < 14; i++) {
      const dayOffset = 9 - Math.floor(i / 1.5);
      const createdAt = Math.min(
        now,
        now - dayOffset * 86400_000 - (i % 3) * 1800_000,
      );
      const key = dayKey(createdAt);
      const lineCount = 1 + Math.floor(rng() * 3);
      const picked = new Set<number>();
      const items: {
        productId: Id<"products">;
        name: string;
        qty: number;
        price: number;
        cost: number;
      }[] = [];
      for (let l = 0; l < lineCount; l++) {
        const idx = Math.floor(rng() * PRODUCTS.length);
        if (picked.has(idx)) continue;
        picked.add(idx);
        const p = PRODUCTS[idx]!;
        const qty = 1 + Math.floor(rng() * 3);
        items.push({
          productId: productIds[idx]!,
          name: p.name,
          qty,
          price: p.price,
          cost: p.cost,
        });
        const doc = await ctx.db.get(productIds[idx]!);
        if (doc) {
          await ctx.db.patch(productIds[idx]!, {
            stock: Math.max(0, doc.stock - qty),
          });
        }
      }
      if (items.length === 0) continue;

      const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
      const discount = i % 5 === 0 ? 2000 : 0;
      const total = subtotal - discount;
      const seq = await nextSequence(ctx, `sale:${userId}:${key}`);
      const number = `INV-${key.replace(/-/g, "")}-${String(seq).padStart(4, "0")}`;
      const method = methods[i % methods.length]!;

      const saleId = await ctx.db.insert("sales", {
        userId,
        number,
        dayKey: key,
        createdAt,
        contactId: i % 4 === 0 ? contactIds[i % 2] : undefined,
        accountId: cashId,
        items,
        subtotal,
        discount,
        taxRate: 0,
        tax: 0,
        total,
        paymentMethod: method,
        amountPaid: total,
        change: 0,
        status: "paid",
      });

      await ctx.db.insert("transactions", {
        userId,
        accountId: cashId,
        direction: "in",
        amount: total,
        category: "Penjualan",
        note: number,
        date: createdAt,
        source: "sale",
        sourceId: saleId,
      });
      const cash = await ctx.db.get(cashId);
      if (cash) {
        await ctx.db.patch(cashId, { balance: cash.balance + total });
      }
    }

    return { seeded: true };
  },
});
