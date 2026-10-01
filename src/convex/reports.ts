import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { dayKey, requireUserId } from "./lib";

type Sale = Doc<"sales">;

function aggregate(sales: Sale[]) {
  let revenue = 0;
  let cogs = 0;
  let tax = 0;
  let paid = 0;
  const byProduct = new Map<string, { qty: number; revenue: number }>();
  for (const sale of sales) {
    revenue += sale.total;
    tax += sale.tax;
    if (sale.status === "paid") paid += sale.total;
    for (const item of sale.items) {
      cogs += item.cost * item.qty;
      const current = byProduct.get(item.name) ?? { qty: 0, revenue: 0 };
      current.qty += item.qty;
      current.revenue += item.price * item.qty;
      byProduct.set(item.name, current);
    }
  }
  const topProducts = [...byProduct.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  return {
    revenue,
    paid,
    cogs,
    tax,
    profit: revenue - tax - cogs,
    count: sales.length,
    topProducts,
  };
}

function buildSeries(sales: Sale[], from: number, to: number) {
  const map = new Map<string, { day: string; revenue: number; count: number }>();
  let cursor = from;
  while (cursor <= to) {
    map.set(dayKey(cursor), { day: dayKey(cursor), revenue: 0, count: 0 });
    cursor += 86400_000;
  }
  for (const sale of sales) {
    const bucket = map.get(sale.dayKey);
    if (bucket) {
      bucket.revenue += sale.total;
      bucket.count += 1;
    }
  }
  return [...map.values()];
}

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const today = dayKey(now);
    const monthStart = Date.parse(`${dayKey(now).slice(0, 7)}-01T00:00:00+07:00`);
    const seriesFrom = Math.min(monthStart, now - 6 * 86400_000);

    const sales = await ctx.db
      .query("sales")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", userId).gte("createdAt", seriesFrom),
      )
      .order("desc")
      .collect();

    const monthSales = sales.filter((s) => s.createdAt >= monthStart);
    const todaySales = sales.filter((s) => s.dayKey === today);
    const month = aggregate(monthSales);

    const products = await ctx.db
      .query("products")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const lowStock = products
      .filter((p) => p.active && p.stock <= p.reorderLevel)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6);
    const inventoryValue = products.reduce(
      (sum, p) => sum + p.costPrice * Math.max(0, p.stock),
      0,
    );

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return {
      storeName: settings?.storeName ?? null,
      today: {
        revenue: todaySales.reduce((sum, s) => sum + s.total, 0),
        count: todaySales.length,
      },
      month,
      series: buildSeries(sales, seriesFrom, now),
      recentSales: sales.slice(0, 8),
      lowStock,
      inventoryValue,
      cashTotal: accounts.reduce((sum, a) => sum + a.balance, 0),
      productCount: products.filter((p) => p.active).length,
    };
  },
});

export const report = query({
  args: { from: v.number(), to: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const from = Math.min(args.from, args.to);
    const to = Math.max(args.from, args.to);

    const sales = await ctx.db
      .query("sales")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", userId).gte("createdAt", from).lte("createdAt", to),
      )
      .order("asc")
      .collect();

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user_created", (q) =>
        q.eq("userId", userId).gte("createdAt", from).lte("createdAt", to),
      )
      .collect();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).gte("date", from).lte("date", to),
      )
      .collect();

    const totals = aggregate(sales);
    const purchaseTotal = purchases.reduce((sum, p) => sum + p.total, 0);
    const cashIn = transactions
      .filter((t) => t.direction === "in")
      .reduce((sum, t) => sum + t.amount, 0);
    const cashOut = transactions
      .filter((t) => t.direction === "out")
      .reduce((sum, t) => sum + t.amount, 0);

    const byMethod = new Map<string, { total: number; count: number }>();
    for (const sale of sales) {
      const current = byMethod.get(sale.paymentMethod) ?? { total: 0, count: 0 };
      current.total += sale.total;
      current.count += 1;
      byMethod.set(sale.paymentMethod, current);
    }

    return {
      ...totals,
      avgTicket: sales.length > 0 ? totals.revenue / sales.length : 0,
      series: buildSeries(sales, from, to),
      purchaseTotal,
      cashIn,
      cashOut,
      paymentMethods: [...byMethod.entries()].map(([method, data]) => ({
        method,
        ...data,
      })),
    };
  },
});
