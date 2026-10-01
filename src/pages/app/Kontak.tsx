import { useMutation, useQuery } from "convex/react";
import { Loader2, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import * as React from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { EmptyState, PageHeader } from "@/components/common";
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
import { Textarea } from "@/components/ui/input";

type Kind = "customer" | "supplier" | "both";

type FormState = {
  kind: Kind;
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
};

const emptyForm: FormState = {
  kind: "customer",
  name: "",
  phone: "",
  email: "",
  address: "",
  note: "",
};

export function Kontak() {
  const contacts = useQuery(api.contacts.list);
  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);
  const removeContact = useMutation(api.contacts.remove);

  const [filter, setFilter] = React.useState<"all" | Kind>("all");
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Doc<"contacts"> | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const list = contacts ?? [];
  const q = search.trim().toLowerCase();
  const filtered = list.filter((c) => {
    const matchFilter =
      filter === "all" || c.kind === filter || c.kind === "both";
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  };

  const openEdit = (contact: Doc<"contacts">) => {
    setEditing(contact);
    setForm({
      kind: contact.kind,
      name: contact.name,
      phone: contact.phone ?? "",
      email: contact.email ?? "",
      address: contact.address ?? "",
      note: contact.note ?? "",
    });
    setError(null);
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const payload = {
      kind: form.kind,
      name: form.name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      note: form.note || undefined,
    };
    setBusy(true);
    try {
      if (editing) await updateContact({ id: editing._id, ...payload });
      else await createContact(payload);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const kindLabel: Record<Kind, string> = {
    customer: "Pelanggan",
    supplier: "Pemasok",
    both: "Pelanggan & pemasok",
  };

  return (
    <div>
      <PageHeader
        title="Kontak"
        description="Data pelanggan dan pemasok tokomu."
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Tambah kontak
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", "Semua"],
                ["customer", "Pelanggan"],
                ["supplier", "Pemasok"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  filter === value
                    ? "border-forest bg-forest text-cream"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari nama atau nomor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
        <CardContent className="pt-0">
          {list.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada kontak"
              description="Simpan pelanggan tetap atau pemasok langganan agar transaksi lebih cepat."
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  Tambah kontak
                </Button>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Nama</TH>
                  <TH>Peran</TH>
                  <TH>Telepon</TH>
                  <TH>Alamat</TH>
                  <TH>Catatan</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {filtered.map((c) => (
                  <TR key={c._id}>
                    <TD>
                      <p className="font-medium">{c.name}</p>
                      {c.email ? (
                        <p className="text-[11px] text-muted-foreground">
                          {c.email}
                        </p>
                      ) : null}
                    </TD>
                    <TD>
                      <Badge variant={c.kind === "supplier" ? "gold" : "default"}>
                        {kindLabel[c.kind]}
                      </Badge>
                    </TD>
                    <TD className="text-muted-foreground">{c.phone || "—"}</TD>
                    <TD className="text-muted-foreground">
                      {c.address || "—"}
                    </TD>
                    <TD className="max-w-40 truncate text-muted-foreground">
                      {c.note || "—"}
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          title="Ubah"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          title="Hapus"
                          onClick={() => {
                            if (window.confirm(`Hapus kontak "${c.name}"?`)) {
                              void removeContact({ id: c._id });
                            }
                          }}
                        >
                          <Trash2 className="text-muted-foreground" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      Tidak ada kontak yang cocok.
                    </td>
                  </tr>
                ) : null}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Ubah kontak" : "Tambah kontak"}
            </DialogTitle>
            <DialogDescription>
              Kontak dipakai pada transaksi kredit dan pembelian.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nama *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Bu Sari"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Peran</Label>
                <Select
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })}
                >
                  <option value="customer">Pelanggan</option>
                  <option value="supplier">Pemasok</option>
                  <option value="both">Keduanya</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telepon</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0812…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nama@email.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Alamat</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Jl. Melati No. 4"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Keterangan tambahan…"
              />
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
                {editing ? "Simpan perubahan" : "Tambah kontak"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
