import { useQuery } from "convex/react";
import { BookOpenCheck, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { EmptyState, PageHeader, StatCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { fmtDate, rp } from "@/lib/utils";

export function Akuntansi() {
  const accounts = useQuery(api.accounts.listAccounts);
  const transactions = useQuery(api.accounts.listTransactions, { limit: 200 });

  const accountList = accounts ?? [];
  const txList = transactions ?? [];
  const totalBalance = accountList.reduce((sum, a) => sum + a.balance, 0);
  const totalIn = txList
    .filter((t) => t.direction === "in")
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = txList
    .filter((t) => t.direction === "out")
    .reduce((s, t) => s + t.amount, 0);

  // Running balance, walking newest → oldest from the current total balance.
  let running = totalBalance;
  const display = txList.map((t) => {
    const row = { ...t, balanceAfter: running };
    running = running - (t.direction === "in" ? t.amount : -t.amount);
    return row;
  });

  const grouped: { date: string; rows: typeof display }[] = [];
  for (const row of display) {
    const date = fmtDate(row.date);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) last.rows.push(row);
    else grouped.push({ date, rows: [row] });
  }

  return (
    <div>
      <PageHeader
        title="Akuntansi"
        description="Jurnal kas otomatis — setiap penjualan dan pembelian langsung tercatat."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Saldo semua akun"
          value={rp(totalBalance)}
          hint={`${accountList.length} akun`}
          icon={Wallet}
        />
        <StatCard
          label="Total kas masuk"
          value={rp(totalIn)}
          hint={`${txList.filter((t) => t.direction === "in").length} entri`}
          icon={TrendingUp}
          tone="mint"
        />
        <StatCard
          label="Total kas keluar"
          value={rp(totalOut)}
          hint={`${txList.filter((t) => t.direction === "out").length} entri`}
          icon={TrendingDown}
          tone="danger"
        />
      </div>

      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Buku kas umum</p>
          </div>

          {txList.length === 0 ? (
            <EmptyState
              icon={BookOpenCheck}
              title="Belum ada entri jurnal"
              description="Catat transaksi penjualan, pembelian, atau mutasi kas — jurnal ini terisi otomatis."
            />
          ) : (
            <div className="space-y-5">
              {grouped.map((group) => (
                <div key={group.date}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.date}
                  </p>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Akun</TH>
                        <TH>Keterangan</TH>
                        <TH>Sumber</TH>
                        <TH className="text-right">Debet (masuk)</TH>
                        <TH className="text-right">Kredit (keluar)</TH>
                        <TH className="text-right">Saldo</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {group.rows.map((t) => (
                        <TR key={t._id}>
                          <TD>{t.accountName}</TD>
                          <TD>
                            <p className="font-medium">{t.category}</p>
                            {t.note ? (
                              <p className="text-[11px] text-muted-foreground">
                                {t.note}
                              </p>
                            ) : null}
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
                          <TD className="text-right num font-medium text-emerald-700">
                            {t.direction === "in" ? rp(t.amount) : "—"}
                          </TD>
                          <TD className="text-right num font-medium text-destructive">
                            {t.direction === "out" ? rp(t.amount) : "—"}
                          </TD>
                          <TD className="text-right num text-muted-foreground">
                            {rp(t.balanceAfter)}
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
