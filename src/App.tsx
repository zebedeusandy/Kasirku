import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/app/AppShell";
import { AuthPage } from "@/pages/Auth";
import { LandingPage } from "@/pages/Landing";
import { Dashboard } from "@/pages/app/Dashboard";
import { Penjualan } from "@/pages/app/Penjualan";
import { Pembelian } from "@/pages/app/Pembelian";
import { Persediaan } from "@/pages/app/Persediaan";
import { KasBank } from "@/pages/app/KasBank";
import { Kontak } from "@/pages/app/Kontak";
import { Akuntansi } from "@/pages/app/Akuntansi";
import { Aset } from "@/pages/app/Aset";
import { Laporan } from "@/pages/app/Laporan";
import { Pengaturan } from "@/pages/app/Pengaturan";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="penjualan" element={<Penjualan />} />
          <Route path="pembelian" element={<Pembelian />} />
          <Route path="persediaan" element={<Persediaan />} />
          <Route path="kas-bank" element={<KasBank />} />
          <Route path="kontak" element={<Kontak />} />
          <Route path="akuntansi" element={<Akuntansi />} />
          <Route path="aset" element={<Aset />} />
          <Route path="laporan" element={<Laporan />} />
          <Route path="pengaturan" element={<Pengaturan />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
