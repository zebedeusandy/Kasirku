import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const paymentMethod = v.union(
  v.literal("cash"),
  v.literal("qris"),
  v.literal("card"),
  v.literal("transfer"),
  v.literal("ewallet"),
);

const schema = defineSchema({
  ...authTables,

  settings: defineTable({
    userId: v.id("users"),
    storeName: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    receiptFooter: v.optional(v.string()),
    taxRate: v.number(),
  }).index("by_user", ["userId"]),

  products: defineTable({
    userId: v.id("users"),
    name: v.string(),
    sku: v.optional(v.string()),
    category: v.optional(v.string()),
    unit: v.string(),
    costPrice: v.number(),
    sellPrice: v.number(),
    stock: v.number(),
    reorderLevel: v.number(),
    active: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_name", ["userId", "name"]),

  contacts: defineTable({
    userId: v.id("users"),
    kind: v.union(
      v.literal("customer"),
      v.literal("supplier"),
      v.literal("both"),
    ),
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    note: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  sales: defineTable({
    userId: v.id("users"),
    number: v.string(),
    dayKey: v.string(),
    createdAt: v.number(),
    contactId: v.optional(v.id("contacts")),
    accountId: v.optional(v.id("accounts")),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        qty: v.number(),
        price: v.number(),
        cost: v.number(),
      }),
    ),
    subtotal: v.number(),
    discount: v.number(),
    taxRate: v.number(),
    tax: v.number(),
    total: v.number(),
    paymentMethod,
    amountPaid: v.number(),
    change: v.number(),
    status: v.union(v.literal("paid"), v.literal("unpaid")),
    note: v.optional(v.string()),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_user_day", ["userId", "dayKey"]),

  purchases: defineTable({
    userId: v.id("users"),
    number: v.string(),
    dayKey: v.string(),
    createdAt: v.number(),
    supplierId: v.optional(v.id("contacts")),
    accountId: v.optional(v.id("accounts")),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        qty: v.number(),
        cost: v.number(),
      }),
    ),
    total: v.number(),
    paid: v.boolean(),
    note: v.optional(v.string()),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_user_day", ["userId", "dayKey"]),

  accounts: defineTable({
    userId: v.id("users"),
    name: v.string(),
    kind: v.union(v.literal("cash"), v.literal("bank")),
    balance: v.number(),
    active: v.boolean(),
  }).index("by_user", ["userId"]),

  transactions: defineTable({
    userId: v.id("users"),
    accountId: v.id("accounts"),
    direction: v.union(v.literal("in"), v.literal("out")),
    amount: v.number(),
    category: v.string(),
    note: v.optional(v.string()),
    date: v.number(),
    source: v.union(
      v.literal("sale"),
      v.literal("purchase"),
      v.literal("manual"),
      v.literal("opening"),
    ),
    sourceId: v.optional(v.string()),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_account", ["accountId", "date"]),

  assets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    category: v.string(),
    acquiredAt: v.number(),
    cost: v.number(),
    salvageValue: v.number(),
    usefulLifeMonths: v.number(),
    note: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  counters: defineTable({
    key: v.string(),
    value: v.number(),
  }).index("by_key", ["key"]),
});

export default schema;
