import { useMutation, useQuery } from "convex/react";
import { Loader2, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import * as React from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
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
import { rp } from "@/lib/utils";

type FormState = {
  name: string;
  sku: string;
  category: string;
  unit: string;
  costPrice: string;
  sellPrice: string;
  stock: string;
  reorderLevel: string;
};

const emptyForm: FormState = {
  name: "",
  sku: "",
  category: "",
  unit: "pcs",
  costPrice: "",
  sellPrice: "",
  stock: "0",
  reorderLevel: "0",
};

export function Persediaan() {
  const products = useQuery(api.products.list);
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);

  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Doc<"products"> | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const list = products ?? [];
  const q = search.trim().toLowerCase();
  const filtered = list.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q),
  );

  const inventoryValue = list.reduce(
    (sum, p) => sum + p.costPrice * Math.max(0, p.stock),
    0,
  );
  const lowCount = list.filter((p) => p.active && p.stock <= p.reorderLevel).length;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  };

  const openEdit = (product: Doc<"products">) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku ?? "",
      category: product.category ?? "",
      unit: product.unit,
      costPrice: String(product.costPrice),
      sellPrice: String(product.sellPrice),
      stock: String(product.stock),
      reorderLevel: String(product.reorderLevel),
    });
    setError(null);
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const payload = {
      name: form.name,
      sku: form.sku || undefined,
      category: form.category || undefined,
      unit: form.unit,
      costPrice: Number(form.costPrice) || 0,
      sellPrice: Number(form.sellPrice) || 0,
      stock: Number(form.stock) || 0,
      reorderLevel: Number(form.reorderLevel) || 0,
    };
    setBusy(true);
    try {
      if (editing) await updateProduct({ id: editing._id, ...payload });
      else await createProduct(payload);
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
        title="Persediaan"
        description="Daftar barang, harga jual, modal, dan stok."
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Tambah barang
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total barang"
          value={String(list.length)}
          hint="SKU aktif terdaftar"
          icon={Package}
        />
        <StatCard
          label="Nilai persediaan"
          value={rp(inventoryValue)}
          hint="Berdasarkan harga modal"
          icon={Package}
          tone="gold"
        />
        <StatCard
          label="Stok menipis"
          value={String(lowCount)}
          hint="Perlu segera dibeli"
          icon={Package}
          tone={lowCount > 0 ? "danger" : "mint"}
        />
      </div>

      <Card className="mt-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari barang…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length} barang
          </span>
        </CardContent>
        <CardContent className="pt-0">
          {list.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Belum ada barang"
              description="Tambahkan barang pertamamu untuk mulai mencatat penjualan."
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  Tambah barang
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Tidak ada barang yang cocok dengan pencarian.
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Barang</TH>
                  <TH>Kategori</TH>
                  <TH className="text-right">Modal</TH>
                  <TH className="text-right">Harga jual</TH>
                  <TH className="text-right">Stok</TH>
                  <TH>Status</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {filtered.map((p) => (
                  <TR key={p._id}>
                    <TD>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.sku ? `SKU ${p.sku} · ` : ""}
                        per {p.unit}
                      </p>
                    </TD>
                    <TD className="text-muted-foreground">
                      {p.category || "—"}
                    </TD>
                    <TD className="text-right text-muted-foreground">
                      {rp(p.costPrice)}
                    </TD>
                    <TD className="text-right font-semibold">
                      {rp(p.sellPrice)}
                    </TD>
                    <TD className="text-right num">{p.stock}</TD>
                    <TD>
                      {p.stock <= 0 ? (
                        <Badge variant="danger">Habis</Badge>
                      ) : p.stock <= p.reorderLevel ? (
                        <Badge variant="warn">Menipis</Badge>
                      ) : (
                        <Badge variant="success">Aman</Badge>
                      )}
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          title="Ubah"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          title="Hapus"
                          onClick={() => {
                            if (
                              window.confirm(`Hapus barang "${p.name}"?`)
                            ) {
                              void removeProduct({ id: p._id });
                            }
                          }}
                        >
                          <Trash2 className="text-muted-foreground" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Ubah barang" : "Tambah barang"}
            </DialogTitle>
            <DialogDescription>
              Harga jual dipakai saat transaksi di kasir.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Nama barang *</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Indomie Goreng"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-sku">SKU</Label>
                <Input
                  id="p-sku"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-cat">Kategori</Label>
                <Input
                  id="p-cat"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="Makanan"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-unit">Satuan</Label>
              <Select
                id="p-unit"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                {["pcs", "botol", "kotak", "bungkus", "kg", "liter", "sachet", "lembar"].map(
                  (u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ),
                )}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-cost">Harga modal (Rp)</Label>
                <Input
                  id="p-cost"
                  inputMode="numeric"
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      costPrice: e.target.value.replace(/[^\d]/g, ""),
                    })
                  }
                  placeholder="2700"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-price">Harga jual (Rp)</Label>
                <Input
                  id="p-price"
                  inputMode="numeric"
                  value={form.sellPrice}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sellPrice: e.target.value.replace(/[^\d]/g, ""),
                    })
                  }
                  placeholder="3500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-stock">Stok awal</Label>
                <Input
                  id="p-stock"
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stock: e.target.value.replace(/[^\d]/g, ""),
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-reorder">Stok minimum</Label>
                <Input
                  id="p-reorder"
                  inputMode="numeric"
                  value={form.reorderLevel}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reorderLevel: e.target.value.replace(/[^\d]/g, ""),
                    })
                  }
                />
              </div>
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
                {editing ? "Simpan perubahan" : "Tambah barang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
