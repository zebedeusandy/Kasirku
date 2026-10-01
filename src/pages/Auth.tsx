import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { ArrowRight, Loader2, ShieldCheck, UserRound } from "lucide-react";
import * as React from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid password") || lower.includes("no user"))
    return "Email atau kata sandi salah.";
  if (lower.includes("already") || lower.includes("exists"))
    return "Email sudah terdaftar. Pilih Masuk.";
  if (lower.includes("password"))
    return "Kata sandi minimal 8 karakter.";
  if (lower.includes("rate") || lower.includes("too many"))
    return "Terlalu banyak percobaan. Coba lagi sebentar lagi.";
  return message.length > 160 ? "Gagal memproses. Coba lagi." : message;
}

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/app";
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.me);
  const navigate = useNavigate();

  const [mode, setMode] = React.useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [guestBusy, setGuestBusy] = React.useState(false);
  const [guestEntered, setGuestEntered] = React.useState(false);

  const isGuest = user?.isAnonymous ?? false;

  React.useEffect(() => {
    if (guestEntered && isAuthenticated && isGuest) {
      navigate(returnTo);
    }
  }, [guestEntered, isAuthenticated, isGuest, navigate, returnTo]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    setBusy(true);
    try {
      await signIn("password", {
        email: email.trim(),
        password,
        flow: mode === "signUp" ? "signUp" : "signIn",
      });
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  const startGuest = async () => {
    setError(null);
    setGuestBusy(true);
    try {
      await signIn("anonymous", {});
      setGuestEntered(true);
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : String(e)));
    } finally {
      setGuestBusy(false);
    }
  };

  if (isLoading || (isAuthenticated && user === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Signed-in with a real account → continue to the app.
  // Guests (anonymous) stay here so they can register without losing data.
  if (isAuthenticated && user !== null && !isGuest) {
    return <Navigate to={returnTo} replace />;
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-forest px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 45% at 20% 0%, rgba(242,169,60,0.16), transparent 70%), radial-gradient(45% 45% at 90% 90%, rgba(18,166,122,0.18), transparent 70%)",
          }}
        />
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-forest">
            ⚡
          </span>
          <span className="text-sm font-semibold text-cream">KasiPOS</span>
        </Link>

        <div className="relative">
          <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight text-cream">
            Kasir, persediaan, dan laporan dalam satu tempat.
          </h2>
          <ul className="mt-7 space-y-3">
            {[
              "🛒 Transaksi tersimpan dalam hitungan detik",
              "📦 Stok berkurang otomatis saat barang terjual",
              "📊 Laba rugi selalu terbaru tanpa hitung manual",
            ].map((t) => (
              <li
                key={t}
                className="flex items-start gap-2.5 text-sm text-cream/70"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-cream/40">
          Gratis untuk memulai · Tanpa kartu kredit
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground lg:hidden"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-forest text-xs text-gold">
              ⚡
            </span>
            KasiPOS
          </Link>

          {isGuest ? (
            <div className="mb-4 rounded-xl border border-gold/50 bg-gold/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    Kamu masuk sebagai <span className="text-gold-deep">tamu</span>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Data yang dibuat saat tamu akan otomatis tersambung ke akun
                    saat kamu mendaftar di halaman ini.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(returnTo)}
                >
                  Kembali
                </Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  {mode === "signIn" ? "Masuk ke akunmu" : "Buat akun toko"}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {mode === "signIn"
                    ? "Lanjutkan transaksi harianmu."
                    : "Gratis, langsung siap jualan."}
                </p>
              </div>
              <div className="flex rounded-lg border bg-background p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setMode("signIn")}
                  className={`rounded-md px-2.5 py-1.5 transition-colors ${
                    mode === "signIn"
                      ? "bg-forest font-medium text-cream"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signUp")}
                  className={`rounded-md px-2.5 py-1.5 transition-colors ${
                    mode === "signUp"
                      ? "bg-forest font-medium text-cream"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Daftar
                </button>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@toko.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Kata sandi</Label>
                  {mode === "signUp" ? (
                    <span className="text-[11px] text-muted-foreground">
                      Minimal 8 karakter
                    </span>
                  ) : null}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "signUp" ? "new-password" : "current-password"
                  }
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "signUp" ? (
                  <>
                    Buat akun
                    <ArrowRight />
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              {mode === "signIn" ? (
                <>
                  Belum punya akun?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signUp")}
                    className="font-medium text-primary hover:underline"
                  >
                    Daftar gratis
                  </button>
                </>
              ) : (
                <>
                  Sudah punya akun?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signIn")}
                    className="font-medium text-primary hover:underline"
                  >
                    Masuk
                  </button>
                </>
              )}
            </p>

            <div className="relative mt-5 text-center">
              <span
                aria-hidden
                className="absolute inset-x-0 top-1/2 h-px bg-border"
              />
              <span className="relative bg-card px-2 text-[11px] text-muted-foreground">
                atau
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              size="lg"
              disabled={guestBusy || busy}
              onClick={() => void startGuest()}
            >
              {guestBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserRound />
              )}
              Lanjutkan sebagai tamu
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Coba seluruh fitur tanpa daftar — kapan saja bisa buat akun.
            </p>
          </div>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            Dengan melanjutkan, kamu menyetujui ketentuan layanan KasiPOS.
          </p>
        </div>
      </div>
    </div>
  );
}
