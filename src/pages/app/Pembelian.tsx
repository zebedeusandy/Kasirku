import { useMutation, useQuery } from "convex/react";
import { Loader2, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import * as React from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { EmptyState, PageHeader, StatCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { fmtDateTime, rp } from "@/lib/utils";

type Line = { productId: string; qty: string; cost: string };

export function Pembelian() {
  const purchases = useQuery(api.purchases.list, { limit: 50 });
  const products = useQuery(api.products.list);
  const contacts = useQuery(api.contacts.list);
  const accounts = useQuery(api.accounts.listAccounts);
  const createPurchase = useMutation(api.purchases.create);

  const [open, setOpen] = React.useState(false);
  const [supplierId, setSupplierId] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [lines, setLines] = React.useState<Line[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const productList = products ?? [];
  const suppliers = (contacts ?? []).filter(
    (c) => c.kind === "supplier" || c.kind === "both",
  );

  const parsedLines = lines
    .map((l) => ({
      productId: l.productId as Id<"products">,
      qty: Math.floor(Number(l.qty) || 0),
      cost: Number(l.cost) || 0,
      name: productList.find((p) => p._id === l.productId)?.name ?? "?",
    }))
    .filter((l) => l.productId && l.qty > 0);
  const total = parsedLines.reduce((sum, l) => sum + l.qty * l.cost, 0);

  const monthStart = Date.parse(
    `${new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 7)}-01T00:00:00+07:00`,
  );
  const monthPurchases = (purchases ?? []).filter(
    (p) => p.createdAt >= monthStart,
  );
  const monthTotal = monthPurchases.reduce((sum, p) => sum + p.total, 0);
  const unpaidCount = (purchases ?? []).filter((p) => !p.paid).length;

  const openDialog = () => {
    const first = productList.find((p) => p.active);
    setSupplierId("");
    setAccountId(accounts?.find((a) => a.kind === "cash")?._id ?? accounts?.[0]?._id ?? "");
    setLines(first ? [{ productId: first._id, qty: "1", cost: String(first.costPrice) }] : []);
    setError(null);
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (parsedLines.length === 0) {
      setError("Pilih minimal satu barang.");
      return;
    }
    setBusy(true);
    try {
      await createPurchase({
        items: parsedLines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          cost: l.cost,
        })),
        supplierId: supplierId ? (supplierId as Id<"contacts">) : undefined,
        accountId: accountId ? (accountId as Id<"accounts">) : undefined,
      });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Pembelian"
        description="Catat restock dari pemasok — stok bertambah dan kas ikut terpotong."
        actions={
          <Button onClick={openDialog} disabled={productList.length === 0}>
            <Plus />
            Buat pembelian
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pembelian bulan ini"
          value={rp(monthTotal)}
          hint={`${monthPurchases.length} dokumen`}
          icon={ShoppingBasket}
        />
        <StatCard
          label="Total pembelian"
          value={rp((purchases ?? []).reduce((s, p) => s + p.total, 0))}
          hint="Sepanjang waktu"
          icon={ShoppingBasket}
          tone="gold"
        />
        <StatCard
          label="Belum dibayar"
          value={String(unpaidCount)}
          hint="Kredit ke pemasok"
          icon={ShoppingBasket}
          tone={unpaidCount > 0 ? "danger" : "mint"}
        />
      </div>

      <Card className="mt-4">
        <CardContent className="p-4">
          {(purchases ?? []).length === 0 ? (
            <EmptyState
              icon={ShoppingBasket}
              title="Belum ada pembelian"
              description={
                productList.length === 0
                  ? "Tambahkan barang dulu di menu Persediaan."
                  : "Buat pembelian pertama untuk menambah stok dan mencatat pengeluaran kas."
              }
              action={
                <Button
                  onClick={openDialog}
                  disabled={productList.length === 0}
                >
                  <Plus />
                  Buat pembelian
                </Button>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>No. pembelian</TH>
                  <TH>Waktu</TH>
                  <TH>Pemasok</TH>
                  <TH>Item</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Total</TH>
                </TR>
              </THead>
              <TBody>
                {(purchases ?? []).map((p) => (
                  <TR key={p._id}>
                    <TD className="font-medium">{p.number}</TD>
                    <TD className="text-muted-foreground">
                      {fmtDateTime(p.createdAt)}
                    </TD>
                    <TD className="text-muted-foreground">
                      {p.supplierName ?? "—"}
                    </TD>
                    <TD className="text-muted-foreground">
                      {p.items.reduce((sum, i) => sum + i.qty, 0)} unit
                    </TD>
                    <TD>
                      <Badge variant={p.paid ? "success" : "warn"}>
                        {p.paid ? "Lunas" : "Kredit"}
                      </Badge>
                    </TD>
                    <TD className="text-right font-semibold">
                      {rp(p.total)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent wide>
          <DialogHeader>
            <DialogTitle>Buat pembelian</DialogTitle>
            <DialogDescription>
              Stok barang bertambah otomatis setelah disimpan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Pemasok</Label>
                <Select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">— Pilih pemasok (opsional)</option>
                  {suppliers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Bayar dari akun</Label>
                <Select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                >
                  <option value="">— Belum dibayar (kredit)</option>
                  {(accounts ?? []).map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} · {rp(a.balance)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_110px_32px] gap-2 px-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Barang</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Harga beli</span>
                <span />
              </div>
              {lines.map((line, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_80px_110px_32px] items-center gap-2"
                >
                  <Select
                    value={line.productId}
                    onChange={(e) => {
                      const next = [...lines];
                      next[index] = { ...line, productId: e.target.value };
                      const product = productList.find(
                        (p) => p._id === e.target.value,
                      );
                      if (product) next[index] = { ...next[index]!, cost: String(product.costPrice) };
                      setLines(next);
                    }}
                  >
                    <option value="">Pilih barang…</option>
                    {productList.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    inputMode="numeric"
                    className="text-center"
                    value={line.qty}
                    onChange={(e) => {
                      const next = [...lines];
                      next[index] = {
                        ...line,
                        qty: e.target.value.replace(/[^\d]/g, ""),
                      };
                      setLines(next);
                    }}
                  />
                  <Input
                    inputMode="numeric"
                    className="text-right"
                    value={line.cost}
                    onChange={(e) => {
                      const next = [...lines];
                      next[index] = {
                        ...line,
                        cost: e.target.value.replace(/[^\d]/g, ""),
                      };
                      setLines(next);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="iconSm"
                    onClick={() =>
                      setLines(lines.filter((_, i) => i !== index))
                    }
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLines([
                    ...lines,
                    { productId: "", qty: "1", cost: "" },
                  ])
                }
              >
                <Plus />
                Tambah baris
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Total pembelian</span>
              <span className="num font-semibold">{rp(total)}</span>
            </div>

            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Simpan pembelian
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
