import { useMutation, useQuery } from "convex/react";
import { Landmark, Loader2, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { api } from "@/convex/_generated/api";
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
import { fmtDate, rp } from "@/lib/utils";

const CATEGORIES = [
  "Peralatan",
  "Kendaraan",
  "Perabot",
  "Bangunan",
  "Lainnya",
];

function bookValue(
  asset: { cost: number; salvageValue: number; usefulLifeMonths: number; acquiredAt: number },
  now: number,
) {
  const monthsUsed = Math.min(
    Math.max(
      Math.floor((now - asset.acquiredAt) / (30 * 86400_000)),
      0,
    ),
    asset.usefulLifeMonths,
  );
  const depPerMonth = (asset.cost - asset.salvageValue) / asset.usefulLifeMonths;
  return Math.max(asset.cost - depPerMonth * monthsUsed, asset.salvageValue);
}

export function Aset() {
  const assets = useQuery(api.assets.list);
  const createAsset = useMutation(api.assets.create);
  const removeAsset = useMutation(api.assets.remove);

  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    category: CATEGORIES[0]!,
    acquiredAt: new Date().toISOString().slice(0, 10),
    cost: "",
    salvageValue: "",
    usefulLifeMonths: "36",
    note: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const list = assets ?? [];
  const now = Date.now();
  const totalCost = list.reduce((sum, a) => sum + a.cost, 0);
  const totalBook = list.reduce((sum, a) => sum + bookValue(a, now), 0);
  const monthlyDep = list.reduce(
    (sum, a) => sum + (a.cost - a.salvageValue) / a.usefulLifeMonths,
    0,
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createAsset({
        name: form.name,
        category: form.category,
        acquiredAt: Date.parse(`${form.acquiredAt}T00:00:00+07:00`),
        cost: Number(form.cost) || 0,
        salvageValue: Number(form.salvageValue) || 0,
        usefulLifeMonths: Number(form.usefulLifeMonths) || 1,
        note: form.note || undefined,
      });
      setOpen(false);
      setForm({
        name: "",
        category: CATEGORIES[0]!,
        acquiredAt: new Date().toISOString().slice(0, 10),
        cost: "",
        salvageValue: "",
        usefulLifeMonths: "36",
        note: "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Aset"
        description="Aset tetap dengan penyusutan garis lurus (straight-line)."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Tambah aset
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total perolehan"
          value={rp(totalCost)}
          hint={`${list.length} aset tercatat`}
          icon={Landmark}
        />
        <StatCard
          label="Nilai buku saat ini"
          value={rp(totalBook)}
          hint={`Akumulasi penyusutan ${rp(totalCost - totalBook)}`}
          icon={Landmark}
          tone="gold"
        />
        <StatCard
          label="Penyusutan / bulan"
          value={rp(monthlyDep)}
          hint="Beban penyusutan rata-rata"
          icon={Landmark}
          tone="mint"
        />
      </div>

      <Card className="mt-4">
        <CardContent className="p-4">
          {list.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title="Belum ada aset"
              description="Catat mesin, perabot, atau kendaraan milik toko beserta umur manfaatnya."
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus />
                  Tambah aset
                </Button>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Aset</TH>
                  <TH>Kategori</TH>
                  <TH>Perolehan</TH>
                  <TH className="text-right">Harga perolehan</TH>
                  <TH className="text-right">Umur manfaat</TH>
                  <TH className="text-right">Penyusunan / bln</TH>
                  <TH className="text-right">Nilai buku</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {list.map((a) => (
                  <TR key={a._id}>
                    <TD>
                      <p className="font-medium">{a.name}</p>
                      {a.note ? (
                        <p className="text-[11px] text-muted-foreground">
                          {a.note}
                        </p>
                      ) : null}
                    </TD>
                    <TD>
                      <Badge variant="muted">{a.category}</Badge>
                    </TD>
                    <TD className="text-muted-foreground">
                      {fmtDate(a.acquiredAt)}
                    </TD>
                    <TD className="text-right num">{rp(a.cost)}</TD>
                    <TD className="text-right num text-muted-foreground">
                      {a.usefulLifeMonths} bln
                    </TD>
                    <TD className="text-right num text-muted-foreground">
                      {rp((a.cost - a.salvageValue) / a.usefulLifeMonths)}
                    </TD>
                    <TD className="text-right num font-semibold">
                      {rp(bookValue(a, now))}
                    </TD>
                    <TD>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          title="Hapus aset"
                          onClick={() => {
                            if (window.confirm(`Hapus aset "${a.name}"?`)) {
                              void removeAsset({ id: a._id });
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
            <DialogTitle>Tambah aset</DialogTitle>
            <DialogDescription>
              Nilai buku dihitung otomatis dari umur manfaat.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama aset *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Kulkas Display"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal perolehan</Label>
                <Input
                  type="date"
                  value={form.acquiredAt}
                  onChange={(e) =>
                    setForm({ ...form, acquiredAt: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Harga perolehan (Rp) *</Label>
                <Input
                  inputMode="numeric"
                  value={form.cost}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cost: e.target.value.replace(/[^\d]/g, ""),
                    })
                  }
                  placeholder="4500000"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nilai sisa (Rp)</Label>
                <Input
                  inputMode="numeric"
                  value={form.salvageValue}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      salvageValue: e.target.value.replace(/[^\d]/g, ""),
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Umur manfaat (bulan) *</Label>
                <Input
                  inputMode="numeric"
                  value={form.usefulLifeMonths}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      usefulLifeMonths: e.target.value.replace(/[^\d]/g, ""),
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Catatan</Label>
                <Input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Opsional"
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
                Simpan aset
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
