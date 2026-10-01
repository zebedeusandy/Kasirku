import { useQuery } from "convex/react";
import {
  BarChart3,
  CalendarDays,
  ShoppingBasket,
  TrendingUp,
} from "lucide-react";
import * as React from "react";
import { api } from "@/convex/_generated/api";
import { EmptyState, PageHeader, StatCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { fmtDay, paymentLabel, rp, rpShort } from "@/lib/utils";

type Preset = "7d" | "30d" | "month";

function presetRange(preset: Preset): { from: number; to: number } {
  const now = Date.now();
  if (preset === "7d") return { from: now - 7 * 86400_000, to: now };
  if (preset === "30d") return { from: now - 30 * 86400_000, to: now };
  const key = new Date(now + 7 * 3600_000).toISOString().slice(0, 7);
  return {
    from: Date.parse(`${key}-01T00:00:00+07:00`),
    to: now,
  };
}

function toDateInput(ts: number) {
  return new Date(ts + 7 * 3600_000).toISOString().slice(0, 10);
}

export function Laporan() {
  const [preset, setPreset] = React.useState<Preset>("7d");
  const [custom, setCustom] = React.useState<{ from: number; to: number } | null>(
    null,
  );

  const range = custom ?? presetRange(preset);
  const report = useQuery(api.reports.report, { from: range.from, to: range.to });

  const applyPreset = (p: Preset) => {
    setPreset(p);
    setCustom(null);
  };

  const applyCustom = (from: string, to: string) => {
    if (!from || !to) return;
    setCustom({
      from: Date.parse(`${from}T00:00:00+07:00`),
      to: Date.parse(`${to}T23:59:59+07:00`),
    });
  };

  if (!report) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-md bg-secondary" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  const maxBar = Math.max(...report.series.map((s) => s.revenue), 1);
  const hasData = report.count > 0 || report.purchaseTotal > 0;

  return (
    <div>
      <PageHeader
        title="Laporan"
        description="Pendapatan, laba, pajak, dan arus kas dalam rentang waktu pilihanmu."
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ["7d", "7 hari"],
                ["30d", "30 hari"],
                ["month", "Bulan ini"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={
                  !custom && preset === value ? "default" : "outline"
                }
                onClick={() => applyPreset(value)}
              >
                <CalendarDays />
                {label}
              </Button>
            ))}
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Dari tanggal</Label>
              <Input
                type="date"
                defaultValue={toDateInput(range.from)}
                onChange={(e) =>
                  applyCustom(e.target.value, toDateInput(range.to))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sampai tanggal</Label>
              <Input
                type="date"
                defaultValue={toDateInput(range.to)}
                onChange={(e) =>
                  applyCustom(toDateInput(range.from), e.target.value)
                }
              />
            </div>
          </div>
          {custom ? (
            <Button size="sm" variant="ghost" onClick={() => applyPreset(preset)}>
              Reset
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pendapatan"
          value={rp(report.revenue)}
          hint={`${report.count} transaksi`}
          icon={TrendingUp}
        />
        <StatCard
          label="Laba kotor"
          value={rp(report.profit)}
          hint={`HPP ${rp(report.cogs)} · pajak ${rp(report.tax)}`}
          icon={TrendingUp}
          tone="mint"
        />
        <StatCard
          label="Rata-rata per transaksi"
          value={rp(report.avgTicket)}
          hint="Nilai keranjang rata-rata"
          icon={BarChart3}
          tone="gold"
        />
        <StatCard
          label="Pembelian"
          value={rp(report.purchaseTotal)}
          hint="Restock pada periode ini"
          icon={ShoppingBasket}
          tone={report.purchaseTotal > 0 ? "danger" : "default"}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Grafik pendapatan</CardTitle>
            <span className="text-xs text-muted-foreground">
              {report.series.length} hari
            </span>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <div className="flex h-52 items-end gap-1.5 overflow-x-auto">
                {report.series.map((point) => (
                  <div
                    key={point.day}
                    className="group flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <span className="num text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {rpShort(point.revenue)}
                    </span>
                    <div
                      className="w-full rounded-t bg-primary/75 transition-all group-hover:bg-primary"
                      style={{
                        height: `${Math.max(3, (point.revenue / maxBar) * 100)}%`,
                      }}
                      title={`${point.day}: ${rp(point.revenue)}`}
                    />
                    <span className="w-10 rotate-0 text-center text-[9px] leading-tight text-muted-foreground">
                      {fmtDay(point.day)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Tidak ada data pada rentang ini.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metode pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {report.paymentMethods.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada transaksi.
              </p>
            ) : (
              report.paymentMethods
                .slice()
                .sort((a, b) => b.total - a.total)
                .map((m) => (
                  <div
                    key={m.method}
                    className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {paymentLabel(m.method)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {m.count} transaksi
                      </p>
                    </div>
                    <span className="num text-sm font-semibold">
                      {rp(m.total)}
                    </span>
                  </div>
                ))
            )}

            <div className="mt-3 space-y-1.5 rounded-lg border bg-background p-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Kas masuk</span>
                <span className="num text-emerald-700">
                  {rp(report.cashIn)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Kas keluar</span>
                <span className="num text-destructive">
                  {rp(report.cashOut)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1.5 font-semibold">
                <span>Arus kas bersih</span>
                <span className="num">
                  {rp(report.cashIn - report.cashOut)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Produk terlaris</CardTitle>
          <Badge variant="gold">{report.topProducts.length} produk</Badge>
        </CardHeader>
        <CardContent>
          {report.topProducts.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Belum ada penjualan"
              description="Produk terlaris akan muncul setelah ada transaksi pada rentang ini."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Peringkat</TH>
                  <TH>Produk</TH>
                  <TH className="text-right">Terjual</TH>
                  <TH className="text-right">Pendapatan kotor</TH>
                </TR>
              </THead>
              <TBody>
                {report.topProducts.map((p, i) => (
                  <TR key={p.name}>
                    <TD className="num text-muted-foreground">{i + 1}</TD>
                    <TD className="font-medium">{p.name}</TD>
                    <TD className="text-right num">{p.qty}</TD>
                    <TD className="text-right num font-semibold">
                      {rp(p.revenue)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
