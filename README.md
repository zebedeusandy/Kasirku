# KasiPOS (Kasirku)

Aplikasi program kasir online — penjualan, persediaan, kas & bank, akuntansi, aset, dan laporan bisnis dalam satu aplikasi. Dibangun dengan React + Vite + Tailwind CSS di sisi klien dan Convex (database, realtime, auth) di sisi server.

## Fitur

- **Auth** — masuk dengan email & kata sandi, atau **lanjutkan sebagai tamu (guest)**. Data tamu tetap tersimpan ketika tamu kemudian mendaftar (akun anonim ditautkan ke akun baru).
- **Dashboard** — ringkasan penjualan hari ini/bulan ini, laba kotor, saldo kas & bank, grafik 7 hari, stok menipis, dan produk terlaris.
- **Penjualan (POS)** — kasir cepat, diskon, pajak (PPN), pembayaran cash/QRIS/card/transfer/e-wallet, dan struk cetak (76mm).
- **Pembelian** — penerimaan barang dari supplier, langsung menambah stok & catatan kas.
- **Persediaan** — CRUD produk, kategori, harga beli/jual, stok, dan batas minimum restock.
- **Kas & Bank** — saldo per akun, mutasi masuk/keluar, ledger dari transaksi penjualan/pembelian.
- **Kontak** — pelanggan & supplier.
- **Akuntansi** — bagan akun (COA) dan jurnal umum.
- **Aset** — pencatatan aset dengan penyusutan garis lurus (per bulan).
- **Laporan** — laporan penjualan, laba/rugi, dan arus kas per rentang tanggal.
- **Pengaturan** — profil toko, footer struk, tarif pajak, akun, dan mode tamu.

## Menjalankan secara lokal

```bash
bun install
bun convex dev --start 'bun run dev'   # Convex lokal + Vite sekaligus
```

Convex berjalan di port 3210 dan Vite di port 5173. Variabel `VITE_CONVEX_URL` dsb. dikelola oleh Convex CLI melalui `.env.local`.

> Catatan: autentikasi Convex memerlukan environment variable `JWT_PRIVATE_KEY` pada deployment Convex (`bun convex env set -- JWT_PRIVATE_KEY "<PEM>"`).

## Perintah lain

```bash
bun tsc -b --noEmit   # typecheck
bun run build         # build produksi ke dist/
```

## Struktur

```
convex.json            # lokasi fungsi Convex → src/convex
src/
  convex/              # backend: schema, auth, http, lib, dan modul bisnis
    schema.ts          # tabel: settings, products, contacts, sales, purchases,
                       # accounts, transactions, assets, counters
    auth.ts            # provider Password + Anonymous, tautan tamu → akun
    seed.ts            # mutation seed:demo (data contoh)
  pages/               # Landing, Auth, dan halaman aplikasi /app/*
  app/AppShell.tsx     # sidebar dengan menu: Dashboard, Penjualan, Pembelian,
                       # Persediaan, Kas & Bank, Kontak, Akuntansi, Aset,
                       # Laporan, Pengaturan
  components/          # komponen UI (shadcn-style) & bersama
  index.css            # tema krem/hutan/emas + CSS cetak struk
```

## Tema

Palet krem (`--cream`), hutan (`--forest`), dan emas (`--gold`), dengan dukungan mode gelap dan aturan cetak khusus untuk struk lebar 76 mm (`#print-area`).
