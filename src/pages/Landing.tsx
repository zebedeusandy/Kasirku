import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Check,
  Clock3,
  Loader2,
  Package,
  Printer,
  Receipt,
  UserRound,
  Wallet,
} from "lucide-react";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { rp } from "@/lib/utils";

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const },
};

const FEATURES = [
  {
    emoji: "🛒",
    icon: Receipt,
    title: "Kasir kilat",
    text: "Cari barang, ketuk, bayar. Transaksi tersimpan di bawah dua detik dan struk langsung siap cetak.",
  },
  {
    emoji: "📦",
    icon: Package,
    title: "Stok otomatis",
    text: "Stok berkurang saat jual dan bertambah saat beli. Peringatan muncul saat barang mulai menipis.",
  },
  {
    emoji: "💰",
    icon: Wallet,
    title: "Kas & bank tercatat",
    text: "Setiap pemasukan dan pengeluaran masuk ke buku kas yang benar, dari modal awal sampai belanja harian.",
  },
  {
    emoji: "📒",
    icon: BookOpenCheck,
    title: "Akuntansi otomatis",
    text: "Penjualan dan pembelian langsung menjadi jurnal — tanpa input ulang, tanpa buku besar manual.",
  },
  {
    emoji: "📊",
    icon: BarChart3,
    title: "Laporan real-time",
    text: "Pendapatan, laba kotor, pajak, dan produk terlaris dalam rentang hari yang kamu pilih sendiri.",
  },
  {
    emoji: "🏦",
    icon: Clock3,
    title: "Aset terpantau",
    text: "Catat mesin, perabot, dan kendaraan. Penyusutan dihitung lurus sampai nilai buku setiap aset.",
  },
];

const MENU_PREVIEW = [
  { emoji: "🏠", label: "Dashboard" },
  { emoji: "🛒", label: "Penjualan" },
  { emoji: "🛍️", label: "Pembelian" },
  { emoji: "📦", label: "Persediaan" },
  { emoji: "💰", label: "Kas & Bank" },
  { emoji: "👥", label: "Kontak" },
  { emoji: "📒", label: "Akuntansi" },
  { emoji: "🏦", label: "Aset" },
  { emoji: "📊", label: "Laporan" },
  { emoji: "⚙️", label: "Pengaturan" },
];

const STEPS = [
  {
    n: "1",
    title: "Daftar toko",
    text: "Buat akun gratis dan beri nama toko. Tidak perlu kartu kredit.",
  },
  {
    n: "2",
    title: "Masukkan barang",
    text: "Isi nama, harga jual, dan modal — atau muat data contoh untuk langsung mencoba.",
  },
  {
    n: "3",
    title: "Mulai jualan",
    text: "Buka layar kasir, terima pembayaran, dan pantau laba dari laporan hari itu juga.",
  },
];

const FAQ = [
  {
    q: "Apakah KasiPOS bisa dipakai di HP?",
    a: "Bisa. KasiPOS berjalan di browser HP, tablet, maupun laptop — tinggal membuka tautan aplikasi, tanpa instalasi.",
  },
  {
    q: "Bagaimana struk dicetak?",
    a: "Setelah pembayaran, struk muncul di layar dan langsung siap dicetak ke printer thermal lewat dialog cetak browser.",
  },
  {
    q: "Apakah laporan keuangannya otomatis?",
    a: "Ya. Setiap penjualan dan pembelian dicatat ke kas serta jurnal secara otomatis, sehingga laporan laba rugi selalu terbaru.",
  },
  {
    q: "Berapa biaya memakainya?",
    a: "Memulai gratis. Kamu bisa mencoba seluruh alur kasir, persediaan, dan laporan tanpa biaya di awal.",
  },
];

function ReceiptMock() {
  const rows = [
    { name: "Indomie Goreng", qty: 3, price: 3500 },
    { name: "Aqua 600ml", qty: 2, price: 4000 },
    { name: "Kopi Kapal Api", qty: 4, price: 2000 },
    { name: "Roti Tawar", qty: 1, price: 16000 },
  ];
  const total = rows.reduce((sum, r) => sum + r.qty * r.price, 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="receipt-paper w-full max-w-[320px] rounded-lg border bg-card p-5 shadow-2xl"
    >
      <div className="text-center">
        <p className="text-xs font-semibold tracking-[0.2em]">KASIKU STORE</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Jl. Melati No. 4 · Jakarta
        </p>
        <p className="text-[10px] text-muted-foreground">
          INV-20261001-0042 · 09:41
        </p>
      </div>
      <div className="my-3 border-t border-dashed" />
      <ul className="space-y-1.5 text-[11px]">
        {rows.map((r) => (
          <li key={r.name} className="flex justify-between gap-3">
            <span className="truncate">
              {r.qty}× {r.name}
            </span>
            <span className="num shrink-0">{rp(r.qty * r.price)}</span>
          </li>
        ))}
      </ul>
      <div className="my-3 border-t border-dashed" />
      <div className="flex justify-between text-[13px] font-semibold">
        <span>TOTAL</span>
        <span className="num">{rp(total)}</span>
      </div>
      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        Terima kasih sudah belanja 🙏
      </p>
    </motion.div>
  );
}

function DashboardMock() {
  const bars = [42, 65, 38, 80, 55, 92, 70];
  const stats = [
    { label: "Hari ini", value: rp(1248000) },
    { label: "Bulan ini", value: rp(18750000) },
    { label: "Laba kotor", value: rp(5320000) },
  ];
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
      <div className="flex items-center gap-2 border-b bg-forest px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-gold" />
        <span className="h-2.5 w-2.5 rounded-full bg-cream/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-cream/25" />
        <span className="ml-2 text-[11px] text-cream/70">
          Dashboard · KasiPOS
        </span>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-background p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="num mt-1 text-sm font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <div className="flex h-32 items-end gap-2 rounded-lg border bg-background p-3">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              whileInView={{ height: `${h}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.07 }}
              className="flex-1 rounded-t bg-primary/80"
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {["Stok aman", "3 barang menipis", "Kas tercatat"].map((t) => (
            <span
              key={t}
              className="rounded-full border bg-secondary px-2.5 py-1 text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [guestRequested, setGuestRequested] = React.useState(false);
  const [guestBusy, setGuestBusy] = React.useState(false);

  React.useEffect(() => {
    if (guestRequested && isAuthenticated) navigate("/app");
  }, [guestRequested, isAuthenticated, navigate]);

  const startGuest = async () => {
    if (isAuthenticated) {
      navigate("/app");
      return;
    }
    setGuestBusy(true);
    try {
      await signIn("anonymous", {});
    } catch {
      setGuestRequested(false);
      navigate("/auth");
    } finally {
      setGuestBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-sm text-gold">
              ⚡
            </span>
            <span className="text-sm font-semibold tracking-tight">
              KasiPOS
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#fitur" className="transition-colors hover:text-foreground">
              Fitur
            </a>
            <a href="#modul" className="transition-colors hover:text-foreground">
              Modul
            </a>
            <a href="#cara-kerja" className="transition-colors hover:text-foreground">
              Cara kerja
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Masuk</Link>
            </Button>
            <Button asChild size="sm" className="bg-forest text-cream hover:bg-forest-soft">
              <Link to="/auth?returnTo=/app">Coba gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 55% at 80% 0%, rgba(242,169,60,0.16), transparent 65%), radial-gradient(50% 50% at 5% 90%, rgba(14,107,78,0.12), transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-mint" />
              Dibuat untuk warung, toko &amp; UMKM Indonesia
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.06 }}
              className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]"
            >
              Jualan lebih cepat,
              <br />
              <span className="text-primary">keuangan selalu rapi.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.14 }}
              className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              KasiPOS adalah aplikasi kasir online yang mencatat penjualan,
              persediaan, kas &amp; bank, sampai laporan laba rugi — otomatis,
              dari satu layar.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <Button
                asChild
                size="lg"
                className="bg-forest text-cream hover:bg-forest-soft"
              >
                <Link to="/auth?returnTo=/app">
                  Mulai gratis
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#fitur">Lihat fitur</a>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                disabled={guestBusy}
                onClick={() => void startGuest()}
                title="Masuk sebagai tamu"
              >
                {guestBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserRound />
                )}
                Coba sebagai tamu
              </Button>
            </motion.div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {["Gratis untuk memulai", "Tanpa kartu kredit", "HP & laptop"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    {t}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="flex justify-center lg:justify-end">
            <ReceiptMock />
          </div>
        </div>
      </section>

      {/* Business strip */}
      <section className="border-y bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <span className="font-medium text-foreground">Cocok untuk:</span>
          {[
            "Warung",
            "Kedai kopi",
            "Toko kelontong",
            "Minimarket",
            "Fashion",
            "Foto & fotokopi",
          ].map((t) => (
            <span key={t} className="rounded-full border bg-background px-3 py-1">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Fitur
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Satu aplikasi untuk seluruh toko
          </h2>
          <p className="mt-3 text-muted-foreground">
            Dari kasir sampai laporan keuangan — semua saling terhubung dan
            terisi sendiri.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              className="group rounded-xl border bg-card p-5 shadow-[0_1px_2px_rgba(23,36,29,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg transition-colors group-hover:bg-gold/20">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {f.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modules / menu */}
      <section id="modul" className="border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <motion.div {...fadeUp}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Modul
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Menu lengkap, tampilan sederhana
            </h2>
            <p className="mt-4 text-muted-foreground">
              Semua yang dibutuhkan toko modern tersusun rapi dalam satu menu —
              dari penjualan harian sampai jurnal akuntansi.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Transaksi harian", "Kasir, riwayat, dan struk"],
                ["Persediaan", "Barang, stok, harga beli"],
                ["Pembelian", "Restock & pembayaran pemasok"],
                ["Laporan", "Pendapatan, laba, pajak"],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-lg border bg-background p-3.5">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp} className="relative">
            <div className="overflow-hidden rounded-xl bg-forest p-5 shadow-2xl">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-forest">
                  ⚡
                </span>
                <div>
                  <p className="text-sm font-semibold text-cream">KasiPOS</p>
                  <p className="text-[10px] text-cream/50">Kasir &amp; akuntansi</p>
                </div>
              </div>
              <ul className="space-y-1">
                {MENU_PREVIEW.map((m, i) => (
                  <motion.li
                    key={m.label}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-cream/70 ${
                      i === 1 ? "bg-cream/10 font-medium text-cream" : ""
                    }`}
                  >
                    <span className="w-5 text-center text-[14px]">{m.emoji}</span>
                    {m.label}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div {...fadeUp}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Laporan
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Tahu persis untung hari ini
            </h2>
            <p className="mt-4 text-muted-foreground">
              Dashboard menampilkan penjualan hari ini, laba bulan berjalan,
              nilai persediaan, dan barang yang harus segera dibeli — tanpa
              membuka satu spreadsheet pun.
            </p>
            <div className="mt-6 space-y-2.5">
              {[
                "Grafik penjualan 7 hari terakhir",
                "Produk terlaris & stok menipis",
                "Saldo kas, bank, dan mutasi otomatis",
              ].map((t) => (
                <p key={t} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {t}
                </p>
              ))}
            </div>
            <Button asChild className="mt-7">
              <Link to="/auth?returnTo=/app">
                Buka dashboard
                <ArrowRight />
              </Link>
            </Button>
          </motion.div>
          <motion.div {...fadeUp}>
            <DashboardMock />
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section id="cara-kerja" className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Cara kerja
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Siap jualan dalam tiga langkah
            </h2>
          </motion.div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="relative rounded-xl border bg-background p-6"
              >
                <span className="num flex h-8 w-8 items-center justify-center rounded-full bg-forest text-sm font-semibold text-gold">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <motion.div {...fadeUp} className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Pertanyaan yang sering muncul
          </h2>
        </motion.div>
        <div className="mt-10 space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border bg-card px-5 py-4 transition-colors open:border-primary/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                {item.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-2xl bg-forest px-6 py-12 text-center sm:px-12"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(45% 70% at 50% 0%, rgba(242,169,60,0.18), transparent 70%)",
            }}
          />
          <div className="relative">
            <Printer className="mx-auto h-7 w-7 text-gold" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-cream sm:text-3xl">
              Buka toko digitalmu hari ini
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-cream/65">
              Daftar gratis, muat data contoh, dan rasakan kasir yang langsung
              terhubung dengan laporan keuangan.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-gold text-forest hover:bg-gold-deep">
                <Link to="/auth?returnTo=/app">
                  Mulai gratis
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-cream/25 bg-transparent text-cream hover:bg-cream/10"
              >
                <Link to="/auth">Sudah punya akun</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-forest text-xs text-gold">
              ⚡
            </span>
            <span className="text-xs text-muted-foreground">
              © 2026 KasiPOS · Aplikasi kasir online
            </span>
          </div>
          <div className="flex gap-5 text-xs text-muted-foreground">
            <a href="#fitur" className="hover:text-foreground">
              Fitur
            </a>
            <a href="#cara-kerja" className="hover:text-foreground">
              Cara kerja
            </a>
            <Link to="/auth" className="hover:text-foreground">
              Masuk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
