import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Banknote,
  LayoutDashboard,
  Loader2,
  Package,
  Plus,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import * as React from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState, PageHeader, StatCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";import { fmtDateTime,
  fmtDay,
  paymentLabel,
  rp,
  rpShort,
} from "@/lib/utils";

export function Dashboard() {
  const data = useQuery(api.reports.dashboard);
  const seed = useMutation(api.seed.demo);
  const [seeding, setSeeding] = React.useState(false);
  const sales = useQuery(api.sales.today);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-md bg-secondary" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  const isEmpty =
    data.productCount === 0 && data.month.count === 0 && !data.storeName;

  if (isEmpty) {
    return (
      <div>
        <PageHeader
          title="Selamat datang 👋"
          description="Isi data toko untuk mulai mencatat penjualan."
        />
        <EmptyState
          icon={LayoutDashboard}
          title="Toko masih kosong"
          description="Muat data contoh berisi 14 produk, contoh transaksi, akun kas, dan kontak — agar kamu langsung melihat seluruh modul bekerja."
          action={
            <Button
              onClick={() => {
                setSeeding(true);
                void seed()
                  .catch(() => undefined)
                  .finally(() => setSeeding(false));
              }}
              disabled={seeding}
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus />
              )}
              Muat data contoh
            </Button>
          }
        />
      </div>
    );
  }

  const maxBar = Math.max(...data.series.map((s) => s.revenue), 1);

  return (
    <div>
      <PageHeader
        title={`Halo${data.storeName ? `, ${data.storeName}` : ""} 👋`}
        description="Ringkasan bisnismu hari ini."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/app/persediaan">
                <Package />
                Kelola barang
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/penjualan">
                <Receipt />
                Buka kasir
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Penjualan hari ini"
          value={rp(data.today.revenue)}
          hint={`${data.today.count} transaksi`}
          icon={Banknote}
        />
        <StatCard
          label="Penjualan bulan ini"
          value={rp(data.month.revenue)}
          hint={`${data.month.count} transaksi`}
          icon={TrendingUp}
        />
        <StatCard
          label="Laba kotor bulan ini"
          value={rp(data.month.profit)}
          hint={`Setelah pajak & HPP · ${rpShort(data.month.cogs)} HPP`}
          icon={TrendingUp}
          tone="mint"
        />
        <StatCard
          label="Saldo kas & bank"
          value={rp(data.cashTotal)}
          hint={`Persediaan ${rpShort(data.inventoryValue)}`}
          icon={Banknote}
          tone="gold"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Penjualan 7 hari terakhir</CardTitle>
            <span className="text-xs text-muted-foreground">
              Total {rp(data.series.reduce((s, x) => s + x.revenue, 0))}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex h-44 items-end gap-2">
              {data.series.map((point) => (
                <div
                  key={point.day}
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <span className="num text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {rpShort(point.revenue)}
                  </span>
                  <div
                    className="w-full rounded-t bg-primary/75 transition-all group-hover:bg-primary"
                    style={{
                      height: `${Math.max(3, (point.revenue / maxBar) * 100)}%`,
                    }}
                    title={rp(point.revenue)}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {fmtDay(point.day)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low stock */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Stok menipis</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gold-deep" />
          </CardHeader>
          <CardContent className="space-y-2">
            {data.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Semua stok aman. 👍
              </p>
            ) : (
              data.lowStock.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Minimum {p.reorderLevel} {p.unit}
                    </p>
                  </div>
                  <Badge variant={p.stock === 0 ? "danger" : "warn"}>
                    {p.stock} {p.unit}
                  </Badge>
                </div>
              ))
            )}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/app/pembelian">Restock sekarang</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Recent sales */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Transaksi terbaru</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/penjualan">Lihat semua</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(sales ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Belum ada transaksi hari ini.
              </p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>No. struk</TH>
                    <TH>Waktu</TH>
                    <TH>Pembayaran</TH>
                    <TH className="text-right">Total</TH>
                  </TR>
                </THead>
                <TBody>
                  {(sales ?? []).slice(0, 7).map((sale) => (
                    <TR key={sale._id}>
                      <TD className="font-medium">{sale.number}</TD>
                      <TD className="text-muted-foreground">
                        {fmtDateTime(sale.createdAt)}
                      </TD>
                      <TD>
                        <Badge variant="muted">
                          {paymentLabel(sale.paymentMethod)}
                        </Badge>
                      </TD>
                      <TD className="text-right font-semibold">
                        {rp(sale.total)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Produk terlaris (bulan ini)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.month.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada penjualan bulan ini.
              </p>
            ) : (
              data.month.topProducts.map((p, i) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest text-[10px] font-semibold text-gold">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm">{p.name}</span>
                  </div>
                  <span className="num shrink-0 text-xs text-muted-foreground">
                    {p.qty} terjual
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
