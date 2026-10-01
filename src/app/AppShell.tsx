import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { LogOut, Menu, X } from "lucide-react";
import * as React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { api } from "@/convex/_generated/api";
import { AuthSplash } from "@/components/RequireAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  emoji: string;
  label: string;
  end?: boolean;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operasional",
    items: [
      { to: "/app", emoji: "🏠", label: "Dashboard", end: true },
      { to: "/app/penjualan", emoji: "🛒", label: "Penjualan" },
      { to: "/app/pembelian", emoji: "🛍️", label: "Pembelian" },
      { to: "/app/persediaan", emoji: "📦", label: "Persediaan" },
      { to: "/app/kas-bank", emoji: "💰", label: "Kas & Bank" },
      { to: "/app/kontak", emoji: "👥", label: "Kontak" },
    ],
  },
  {
    label: "Akuntansi",
    items: [
      { to: "/app/akuntansi", emoji: "📒", label: "Akuntansi" },
      { to: "/app/aset", emoji: "🏦", label: "Aset" },
      { to: "/app/laporan", emoji: "📊", label: "Laporan" },
    ],
  },
  {
    label: "Sistem",
    items: [{ to: "/app/pengaturan", emoji: "⚙️", label: "Pengaturan" }],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const settings = useQuery(api.settings.get);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-base text-forest">
          ⚡
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-cream">
            {settings?.storeName ?? "KasiPOS"}
          </p>
          <p className="text-[11px] text-cream/50">Kasir &amp; akuntansi</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/40">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-cream/10 font-medium text-cream"
                          : "text-cream/65 hover:bg-cream/5 hover:text-cream",
                      )
                    }
                  >
                    <span className="w-5 text-center text-[15px] leading-none">
                      {item.emoji}
                    </span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-cream/10 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-cream/40">
          Struk, stok, kas, dan laporan — semua tercatat otomatis.
        </p>
      </div>
    </div>
  );
}

function UserBar() {
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const settings = useQuery(api.settings.get);
  const user = useQuery(api.users.me);
  if (!isAuthenticated) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="flex items-center justify-end gap-1.5 text-xs font-medium leading-tight text-foreground">
          {settings?.storeName ?? "Toko Anda"}
          {user?.isAnonymous ? (
            <Badge variant="gold" className="px-1.5 py-0">
              Tamu
            </Badge>
          ) : null}
        </p>
        <p className="text-[11px] leading-tight text-muted-foreground">
          {user?.isAnonymous ? "Mode tamu" : "Akun aktif"}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => void signOut()}
        title="Keluar"
      >
        <LogOut className="h-3.5 w-3.5" />
        Keluar
      </Button>
    </div>
  );
}

export function AppShell() {
  const { isLoading } = useConvexAuth();
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (isLoading) return <AuthSplash label="Memuat aplikasi…" />;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-forest lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-forest/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-forest shadow-2xl">
            <button
              className="absolute right-3 top-4 rounded-md p-1.5 text-cream/70 hover:bg-cream/10"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <button
              className="rounded-md p-2 text-foreground hover:bg-secondary lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <span className="text-sm font-semibold tracking-tight lg:hidden">
              KasiPOS
            </span>
          </div>
          <UserBar />
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
