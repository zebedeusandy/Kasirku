import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, LogOut, Save, Store, UserRound } from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";

export function Pengaturan() {
  const settings = useQuery(api.settings.get);
  const user = useQuery(api.users.me);
  const upsert = useMutation(api.settings.upsert);
  const { signOut } = useAuthActions();
  const navigate = useNavigate();

  const [form, setForm] = React.useState<{
    storeName: string;
    address: string;
    phone: string;
    receiptFooter: string;
    taxRate: string;
  } | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (settings && form === null) {
      setForm({
        storeName: settings.storeName,
        address: settings.address ?? "",
        phone: settings.phone ?? "",
        receiptFooter: settings.receiptFooter ?? "",
        taxRate: String(settings.taxRate),
      });
    }
  }, [settings, form]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await upsert({
        storeName: form.storeName,
        address: form.address || undefined,
        phone: form.phone || undefined,
        receiptFooter: form.receiptFooter || undefined,
        taxRate: Number(form.taxRate) || 0,
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Pengaturan"
        description="Identitas toko, struk, dan pajak yang dipakai di seluruh aplikasi."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Profil toko
            </CardTitle>
            <CardDescription>
              Nama toko tampil di dashboard, struk cetak, dan laporan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!form ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-9 w-full animate-pulse rounded-lg bg-secondary"
                  />
                ))}
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="store-name">Nama toko *</Label>
                    <Input
                      id="store-name"
                      value={form.storeName}
                      onChange={(e) =>
                        setForm({ ...form, storeName: e.target.value })
                      }
                      placeholder="Kasiku Store"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="store-phone">Telepon</Label>
                    <Input
                      id="store-phone"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="021-5550-1234"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="store-address">Alamat</Label>
                  <Input
                    id="store-address"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Jl. Melati No. 4, Jakarta"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="store-tax">
                      Tarif pajak (%) — PPN aktif
                    </Label>
                    <Input
                      id="store-tax"
                      inputMode="numeric"
                      value={form.taxRate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          taxRate: e.target.value.replace(/[^\d]/g, ""),
                        })
                      }
                      placeholder="0"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Isi 11 untuk PPN 11%, atau 0 bila tidak berbayar pajak.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="store-footer">Footer struk</Label>
                    <Textarea
                      id="store-footer"
                      value={form.receiptFooter}
                      onChange={(e) =>
                        setForm({ ...form, receiptFooter: e.target.value })
                      }
                      placeholder="Terima kasih sudah belanja 🙏"
                      rows={3}
                    />
                  </div>
                </div>

                {error ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </p>
                ) : null}
                {saved ? (
                  <p className="rounded-lg border border-mint/40 bg-mint/10 px-3 py-2 text-xs text-emerald-700">
                    Pengaturan tersimpan.
                  </p>
                ) : null}

                <div className="flex justify-end">
                  <Button type="submit" disabled={busy}>
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save />
                    )}
                    Simpan pengaturan
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modul aktif</CardTitle>
              <CardDescription>
                Semua modul ini sudah terhubung ke data yang sama.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {[
                "🏠 Dashboard",
                "🛒 Penjualan",
                "🛍️ Pembelian",
                "📦 Persediaan",
                "💰 Kas & Bank",
                "👥 Kontak",
                "📒 Akuntansi",
                "🏦 Aset",
                "📊 Laporan",
              ].map((m) => (
                <span
                  key={m}
                  className="rounded-full border bg-secondary/60 px-2.5 py-1 text-[11px] text-secondary-foreground"
                >
                  {m}
                </span>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Akun</CardTitle>
              <CardDescription>
                {user?.isAnonymous
                  ? "Kamu sedang masuk sebagai tamu."
                  : user?.email
                    ? `Masuk sebagai ${user.email}`
                    : "Akun aktif pada perangkat ini."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {user?.isAnonymous ? (
                <>
                  <div className="rounded-lg border border-gold/50 bg-gold/10 px-3 py-2.5 text-xs leading-relaxed">
                    Buat akun agar data toko tersimpan permanen — data tamu
                    akan otomatis tersambung ke akun barumu.
                  </div>
                  <Button
                    className="w-full"
                    onClick={() =>
                      navigate("/auth?returnTo=/app/pengaturan")
                    }
                  >
                    <UserRound />
                    Buat akun permanen
                  </Button>
                </>
              ) : null}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void signOut()}
              >
                <LogOut />
                Keluar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
