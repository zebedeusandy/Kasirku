import { useConvexAuth } from "@convex-dev/auth/react";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";

export function AuthSplash({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest text-lg text-gold">
        ⚡
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

/** Renders children only when signed in; otherwise sends the user to /auth
 *  with the intended path preserved in `returnTo`. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const location = useLocation();

  if (isLoading) return <AuthSplash label="Memeriksa sesi…" />;
  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }
  return <>{children}</>;
}
