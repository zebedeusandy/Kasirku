import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

const root = createRoot(document.getElementById("root")!);

if (!convexUrl) {
  root.render(
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-xl border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold">Konfigurasi belum lengkap</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <code className="rounded bg-secondary px-1 py-0.5 text-xs">
            VITE_CONVEX_URL
          </code>{" "}
          belum tersedia. Jalankan <code className="rounded bg-secondary px-1 py-0.5 text-xs">
            bun convex dev --once
          </code>{" "}
          dari root proyek untuk membuat deployment Convex, lalu muat ulang.
        </p>
      </div>
    </div>,
  );
} else {
  const convex = new ConvexReactClient(convexUrl);
  root.render(
    <StrictMode>
      <ConvexAuthProvider client={convex}>
        <App />
      </ConvexAuthProvider>
    </StrictMode>,
  );
}
