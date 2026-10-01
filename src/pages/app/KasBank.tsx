import { useMutation, useQuery } from "convex/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
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

export function KasBank() {
  const accounts = useQuery(api.accounts.listAccounts);
  const transactions = useQuery(api.accounts.listTransactions, { limit: 100 });
  const createAccount = useMutation(api.accounts.createAccount);
  const addTransaction = useMutation(api.accounts.addTransaction);
  const removeTransaction = useMutation(api.accounts.removeTransaction);

  const [accountOpen, setAccountOpen] = React.useState(false);
  const [txOpen, setTxOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [accName, setAccName] = React.useState("");
  const [accKind, setAccKind] = React.useState<"cash" | "bank">("cash");
  const [accOpening, setAccOpening] = React.useState("");

  const [txAccount, setTxAccount] = React.useState("");
  const [txDirection, setTxDirection] = React.useState<"in" | "out">("out");
  const [txAmount, setTxAmount] = React.useState("");
  const [txCategory, setTxCategory] = React.useState("");
  const [txNote, setTxNote] = React.useState("");

  const accountList = accounts ?? [];
  const totalBalance = accountList.reduce((sum, a) => sum + a.balance, 0);
  const txList = transactions ?? [];
  const totalIn = txList
    .filter((t) => t.direction === "in")
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = txList
    .filter((t) => t.direction === "out")
    .reduce((s, t) => s + t.amount, 0);

  const submitAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createAccount({
        name: accName,
        kind: accKind,
        openingBalance: Number(accOpening) || 0,
      });
      setAccountOpen(false);
      setAccName("");
      setAccOpening("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const submitTransaction = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await addTransaction({
        accountId: txAccount as Id<"accounts">,
        direction: txDirection,
        amount: Number(txAmount) || 0,
        category: txCategory,
        note: txNote || undefined,
      });
      setTxOpen(false);
      setTxAmount("");
      setTxCategory("");
      setTxNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const openTx = () => {
    setTxAccount(accountList[0]?._id ?? "");
    setTxDirection("out");
    setError(null);
    setTxOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Kas & Bank"
        description="Saldo setiap akun dan seluruh mutasi kas secara otomatis."
        actions={
          <>
            <Button variant="outline" onClick={() => setAccountOpen(true)}>
              <Plus />
              Tambah akun
            </Button>
            <Button onClick={openTx} disabled={accountList.length === 0}>
              <Plus />
              Catat mutasi
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total saldo"
          value={rp(totalBalance)}
          hint={`${accountList.length} akun aktif`}
          icon={Wallet}
        />
        <StatCard
          label="Kas masuk (100 mutasi)"
          value={rp(totalIn)}
          hint="Penjualan & pemasukan"
          icon={ArrowDownLeft}
          tone="mint"
        />
        <StatCard
          label="Kas keluar (100 mutasi)"
          value={rp(totalOut)}
          hint="Pembelian & pengeluaran"
          icon={ArrowUpRight}
          tone="danger"
        />
      </div>

      {accountList.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Wallet}
            title="Belum ada akun kas"
            description="Buat akun Kas Tunai atau rekening bank untuk mulai mencatat pemasukan dan pengeluaran."
            action={
              <Button onClick={() => setAccountOpen(true)}>
                <Plus />
                Tambah akun
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {accountList.map((a) => (
              <Card key={a._id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {a.kind === "cash" ? "💵" : "🏦"}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{a.name}</p>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {a.kind === "cash" ? "Kas tunai" : "Bank"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={a.balance > 0 ? "success" : "muted"}>
                      {a.balance > 0 ? "Aktif" : "Nol"}
                    </Badge>
                  </div>
                  <p className="num mt-3 text-2xl font-semibold tracking-tight">
                    {rp(a.balance)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-4">
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-semibold">Mutasi terakhir</p>
              <Table>
                <THead>
                  <TR>
                    <TH>Tanggal</TH>
                    <TH>Akun</TH>
                    <TH>Keterangan</TH>
                    <TH className="text-right">Masuk</TH>
                    <TH className="text-right">Keluar</TH>
                    <TH>Sumber</TH>
                    <TH />
                  </TR>
                </THead>
                <TBody>
                  {txList.map((t) => (
                    <TR key={t._id}>
                      <TD className="text-muted-foreground">
                        {fmtDateTime(t.date)}
                      </TD>
                      <TD>{t.accountName}</TD>
                      <TD>
                        <p className="font-medium">{t.category}</p>
                        {t.note ? (
                          <p className="text-[11px] text-muted-foreground">
                            {t.note}
                          </p>
                        ) : null}
                      </TD>
                      <TD className="text-right num font-semibold text-emerald-700">
                        {t.direction === "in" ? rp(t.amount) : "—"}
                      </TD>
                      <TD className="text-right num font-semibold text-destructive">
                        {t.direction === "out" ? rp(t.amount) : "—"}
                      </TD>
                      <TD>
                        <Badge variant="muted">
                          {t.source === "sale"
                            ? "Penjualan"
                            : t.source === "purchase"
                              ? "Pembelian"
                              : t.source === "opening"
                                ? "Modal"
                                : "Manual"}
                        </Badge>
                      </TD>
                      <TD>
                        <div className="flex justify-end">
                          {t.source === "manual" ? (
                            <Button
                              variant="ghost"
                              size="iconSm"
                              title="Hapus mutasi"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Hapus mutasi manual ini? Saldo akun akan disesuaikan.",
                                  )
                                ) {
                                  void removeTransaction({ id: t._id });
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
              {txList.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Belum ada mutasi.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add account */}
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah akun</DialogTitle>
            <DialogDescription>
              Contoh: Kas Toko, Bank BCA, atau Dompet Digital.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitAccount} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama akun</Label>
              <Input
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                placeholder="Kas Toko"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Jenis</Label>
                <Select
                  value={accKind}
                  onChange={(e) =>
                    setAccKind(e.target.value as "cash" | "bank")
                  }
                >
                  <option value="cash">Kas tunai</option>
                  <option value="bank">Bank</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Saldo awal (Rp)</Label>
                <Input
                  inputMode="numeric"
                  value={accOpening}
                  onChange={(e) =>
                    setAccOpening(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="0"
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
                onClick={() => setAccountOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Simpan akun
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add transaction */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat mutasi</DialogTitle>
            <DialogDescription>
              Pengeluaran operasional atau pemasukan di luar penjualan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitTransaction} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Akun</Label>
              <Select
                value={txAccount}
                onChange={(e) => setTxAccount(e.target.value)}
                required
              >
                {accountList.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name} · {rp(a.balance)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Arah</Label>
                <Select
                  value={txDirection}
                  onChange={(e) =>
                    setTxDirection(e.target.value as "in" | "out")
                  }
                >
                  <option value="out">Kas keluar</option>
                  <option value="in">Kas masuk</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Jumlah (Rp)</Label>
                <Input
                  inputMode="numeric"
                  value={txAmount}
                  onChange={(e) =>
                    setTxAmount(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="50000"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Input
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                placeholder="Operasional, Listrik, Sewa…"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Input
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                placeholder="Opsional"
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
                onClick={() => setTxOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Simpan mutasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
