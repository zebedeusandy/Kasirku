import { useMutation, useQuery } from "convex/react";
import {
  Banknote,
  Minus,
  Printer,
  Receipt as ReceiptIcon,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import * as React from "react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { EmptyState, PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn, fmtDateTime, fmtTime, paymentLabel, rp } from "@/lib/utils";

function ReceiptDialog({
  sale,
  storeName,
  receiptFooter,
  onClose,
}: {
  sale: Doc<"sales">;
  storeName: string;
  receiptFooter?: string;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Struk {sale.number}</DialogTitle>
          <DialogDescription>
            {fmtDateTime(sale.createdAt)} · {paymentLabel(sale.paymentMethod)}
          </DialogDescription>
        </DialogHeader>

        <div
          id="print-area"
          className="receipt-paper rounded-lg border bg-card p-4 text-[11px] leading-relaxed"
        >
          <p className="text-center text-[13px] font-semibold tracking-[0.18em]">
            {(storeName || "TOKO ANDA").toUpperCase()}
          </p>
          <p className="mt-0.5 text-center text-muted-foreground">
            {sale.number} · {fmtTime(sale.createdAt)}
          </p>
          <div className="my-2 border-t border-dashed" />
          <ul className="space-y-1">
            {sale.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3">
                <span className="truncate">
                  {item.qty}× {item.name}
                </span>
                <span className="num shrink-0">{rp(item.qty * item.price)}</span>
              </li>
            ))}
          </ul>
          <div className="my-2 border-t border-dashed" />
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="num">{rp(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 ? (
              <div className="flex justify-between">
                <span>Diskon</span>
                <span className="num">−{rp(sale.discount)}</span>
              </div>
            ) : null}
            {sale.tax > 0 ? (
              <div className="flex justify-between">
                <span>Pajak ({sale.taxRate}%)</span>
                <span className="num">{rp(sale.tax)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-[13px] font-semibold">
              <span>TOTAL</span>
              <span className="num">{rp(sale.total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Bayar</span>
              <span className="num">{rp(sale.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Kembali</span>
              <span className="num">{rp(sale.change)}</span>
            </div>
          </div>
          <div className="my-2 border-t border-dashed" />
          <p className="text-center text-muted-foreground">
            {receiptFooter || "Terima kasih sudah belanja 🙏"}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer />
            Cetak
          </Button>
          <Button onClick={onClose}>Selesai</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Penjualan() {
  const products = useQuery(api.products.list);
  const accounts = useQuery(api.accounts.listAccounts);
  const settings = useQuery(api.settings.get);
  const history = useQuery(api.sales.list, { limit: 25 });
  const createSale = useMutation(api.sales.create);
  const voidSale = useMutation(api.sales.voidSale);

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("Semua");
  const [cart, setCart] = React.useState<Record<string, number>>({});
  const [discount, setDiscount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "cash" | "qris" | "card" | "transfer" | "ewallet"
  >("cash");
  const [accountId, setAccountId] = React.useState<string>("");
  const [amountPaid, setAmountPaid] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [receiptId, setReceiptId] = React.useState<Id<"sales"> | null>(null);

  const productList = products ?? [];
  const categories = React.useMemo(
    () => ["Semua", ...new Set(productList.map((p) => p.category).filter((c): c is string => Boolean(c)))],
    [productList],
  );

  const filtered = productList.filter((p) => {
    if (!p.active) return false;
    const matchesCategory = category === "Semua" || p.category === category;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const taxRate = settings?.taxRate ?? 0;
  const cartLines = Object.entries(cart)
    .map(([id, qty]) => {
      const product = productList.find((p) => p._id === id);
      return product ? { product, qty } : null;
    })
    .filter((l): l is { product: (typeof productList)[number]; qty: number } => l !== null);

  const subtotal = cartLines.reduce(
    (sum, l) => sum + l.product.sellPrice * l.qty,
    0,
  );
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const tax = Math.round(((subtotal - discountValue) * taxRate) / 100);
  const total = subtotal - discountValue + tax;
  const paidValue = amountPaid === "" ? total : Math.max(Number(amountPaid) || 0, 0);
  const change = Math.max(paidValue - total, 0);
  const unpaid = paidValue < total;

  const activeAccountId = accountId || accounts?.[0]?._id || "";

  const addProduct = (product: (typeof productList)[number]) => {
    setCart((prev) => {
      const current = prev[product._id] ?? 0;
      if (current >= product.stock) return prev;
      return { ...prev, [product._id]: current + 1 };
    });
  };

  const setQty = (id: string, qty: number, max: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(qty, max);
      return next;
    });
  };

  const quickCash = (value: number) => setAmountPaid(String(value));

  const checkout = async () => {
    setError(null);
    if (cartLines.length === 0) {
      setError("Keranjang masih kosong.");
      return;
    }
    setBusy(true);
    try {
      const saleId = await createSale({
        items: cartLines.map((l) => ({
          productId: l.product._id,
          qty: l.qty,
        })),
        discount: discountValue,
        paymentMethod,
        amountPaid: paidValue,
        accountId: activeAccountId ? (activeAccountId as Id<"accounts">) : undefined,
      });
      setReceiptId(saleId);
      setCart({});
      setDiscount("");
      setAmountPaid("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const receiptSale = history?.find((s) => s._id === receiptId) ?? null;

  return (
    <div>
      <PageHeader
        title="Penjualan"
        description="Ketuk produk untuk menambah ke keranjang, lalu selesaikan pembayaran."
        actions={
          <Badge variant="gold" className="px-3 py-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            {history?.length ?? 0} transaksi tercatat
          </Badge>
        }
      />

      {productList.length === 0 ? (
        <EmptyState
          icon={ReceiptIcon}
          title="Belum ada barang"
          description="Tambahkan barang di menu Persediaan, atau muat data contoh dari Dashboard."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Product picker */}
          <div className="space-y-3">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Cari nama barang atau SKU…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      category === c
                        ? "border-forest bg-forest text-cream"
                        : "bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => {
                const qty = cart[p._id] ?? 0;
                const out = p.stock <= 0;
                return (
                  <button
                    key={p._id}
                    onClick={() => addProduct(p)}
                    disabled={out || qty >= p.stock}
                    className={cn(
                      "group relative rounded-xl border bg-card p-3 text-left transition-all",
                      out
                        ? "cursor-not-allowed opacity-50"
                        : "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
                    )}
                  >
                    {qty > 0 ? (
                      <span className="num absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                        {qty}
                      </span>
                    ) : null}
                    <p className="line-clamp-2 min-h-9 text-sm font-medium leading-snug">
                      {p.name}
                    </p>
                    <p className="num mt-2 text-sm font-semibold text-primary">
                      {rp(p.sellPrice)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {out ? "Habis" : `Stok ${p.stock} ${p.unit}`}
                    </p>
                  </button>
                );
              })}
              {filtered.length === 0 ? (
                <p className="col-span-full rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Tidak ada barang yang cocok.
                </p>
              ) : null}
            </div>
          </div>

          {/* Cart */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Keranjang</CardTitle>
                {cartLines.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => setCart({})}
                    title="Kosongkan keranjang"
                  >
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3">
                {cartLines.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Keranjang kosong.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {cartLines.map(({ product, qty }) => (
                      <li
                        key={product._id}
                        className="rounded-lg border bg-background p-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight">
                            {product.name}
                          </p>
                          <span className="num text-sm font-semibold">
                            {rp(product.sellPrice * qty)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="iconSm"
                              onClick={() =>
                                setQty(product._id, qty - 1, product.stock)
                              }
                            >
                              <Minus />
                            </Button>
                            <span className="num w-8 text-center text-sm font-medium">
                              {qty}
                            </span>
                            <Button
                              variant="outline"
                              size="iconSm"
                              disabled={qty >= product.stock}
                              onClick={() =>
                                setQty(product._id, qty + 1, product.stock)
                              }
                            >
                              +
                            </Button>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {rp(product.sellPrice)}/{product.unit}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="discount">Diskon (Rp)</Label>
                    <Input
                      id="discount"
                      inputMode="numeric"
                      placeholder="0"
                      value={discount}
                      onChange={(e) =>
                        setDiscount(e.target.value.replace(/[^\d]/g, ""))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="method">Pembayaran</Label>
                    <Select
                      id="method"
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value as typeof paymentMethod,
                        )
                      }
                    >
                      <option value="cash">Tunai</option>
                      <option value="qris">QRIS</option>
                      <option value="card">Kartu</option>
                      <option value="transfer">Transfer</option>
                      <option value="ewallet">E-Wallet</option>
                    </Select>
                  </div>
                </div>

                {(accounts?.length ?? 0) > 0 ? (
                  <div className="space-y-1">
                    <Label htmlFor="account">Masuk ke akun</Label>
                    <Select
                      id="account"
                      value={activeAccountId}
                      onChange={(e) => setAccountId(e.target.value)}
                    >
                      {(accounts ?? []).map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} · {rp(a.balance)}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : null}

                <div className="space-y-1">
                  <Label htmlFor="paid">Dibayar</Label>
                  <Input
                    id="paid"
                    inputMode="numeric"
                    placeholder={String(total)}
                    value={amountPaid}
                    onChange={(e) =>
                      setAmountPaid(e.target.value.replace(/[^\d]/g, ""))
                    }
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => quickCash(total)}
                    >
                      Uang pas
                    </Button>
                    {[5000, 10000, 20000, 50000, 100000]
                      .filter((d) => d >= total)
                      .slice(0, 3)
                      .map((d) => (
                        <Button
                          key={d}
                          variant="outline"
                          size="sm"
                          onClick={() => quickCash(d)}
                        >
                          {rp(d)}
                        </Button>
                      ))}
                  </div>
                </div>

                <div className="space-y-1.5 rounded-lg border bg-background p-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="num">{rp(subtotal)}</span>
                  </div>
                  {discountValue > 0 ? (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Diskon</span>
                      <span className="num">−{rp(discountValue)}</span>
                    </div>
                  ) : null}
                  {tax > 0 ? (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Pajak ({taxRate}%)</span>
                      <span className="num">{rp(tax)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
                    <span>Total</span>
                    <span className="num">{rp(total)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Kembalian</span>
                    <span className="num">{rp(change)}</span>
                  </div>
                  {unpaid && cartLines.length > 0 ? (
                    <p className="text-xs text-gold-deep">
                      Kurang {rp(total - paidValue)} — akan dicatat belum lunas.
                    </p>
                  ) : null}
                </div>

                {error ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </p>
                ) : null}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={busy || cartLines.length === 0}
                  onClick={() => void checkout()}
                >
                  <Banknote />
                  {busy ? "Memproses…" : `Bayar ${rp(total)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* History */}
      <Card className="mt-5">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Riwayat transaksi</CardTitle>
          <span className="text-xs text-muted-foreground">
            24 terakhir
          </span>
        </CardHeader>
        <CardContent>
          {(history ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada transaksi.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>No. struk</TH>
                  <TH>Waktu</TH>
                  <TH>Item</TH>
                  <TH>Pembayaran</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Total</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {(history ?? []).map((sale) => (
                  <TR key={sale._id}>
                    <TD className="font-medium">{sale.number}</TD>
                    <TD className="text-muted-foreground">
                      {fmtDateTime(sale.createdAt)}
                    </TD>
                    <TD className="text-muted-foreground">
                      {sale.items.reduce((sum, i) => sum + i.qty, 0)} unit
                    </TD>
                    <TD>
                      <Badge variant="muted">
                        {paymentLabel(sale.paymentMethod)}
                      </Badge>
                    </TD>
                    <TD>
                      <Badge variant={sale.status === "paid" ? "success" : "warn"}>
                        {sale.status === "paid" ? "Lunas" : "Belum lunas"}
                      </Badge>
                    </TD>
                    <TD className="text-right font-semibold">
                      {rp(sale.total)}
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          title="Lihat struk"
                          onClick={() => setReceiptId(sale._id)}
                        >
                          <Printer className="text-muted-foreground" />
                        </Button>
                        {sale.status === "paid" ? (
                          <Button
                            variant="ghost"
                            size="iconSm"
                            title="Batalkan transaksi"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Batalkan ${sale.number}? Stok akan dikembalikan.`,
                                )
                              ) {
                                void voidSale({ id: sale._id });
                              }
                            }}
                          >
                            <Trash2 className="text-muted-foreground" />
                          </Button>
                        ) : null}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {receiptSale ? (
        <ReceiptDialog
          sale={receiptSale}
          storeName={settings?.storeName ?? ""}
          receiptFooter={settings?.receiptFooter}
          onClose={() => setReceiptId(null)}
        />
      ) : null}
    </div>
  );
}
