"use client";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmiConfig";
import { TelegramProvider } from "./TelegramProvider";
import { PrivyAuthProvider } from "./PrivyContext";
import { useState, useEffect, Component, type ReactNode } from "react";

// ── Error boundary to catch provider crashes and show them on-screen ────────
class ProviderErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(e: unknown) {
    return { error: String(e) };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#06060f",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          gap: "12px",
          fontFamily: "monospace",
        }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <p style={{ color: "#F5A623", fontWeight: "bold", fontSize: 14 }}>Ошибка инициализации</p>
          <pre style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "12px",
            fontSize: 11,
            maxWidth: "100%",
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            color: "#ff6060",
          }}>
            {this.state.error}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main provider ────────────────────────────────────────────────────────────

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, retry: 2 },
        },
      })
  );

  // Privy and wagmi access browser APIs (window, crypto, localStorage)
  // during initialization — skip SSR entirely to avoid 500 errors.
  useEffect(() => {
    // Inject Telegram initData into location.hash BEFORE Privy mounts.
    // Privy detects #tgWebAppData= and auto-authenticates seamlessly.
    // Must run here (before setMounted) so Privy reads the hash on first mount.
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.initData && !window.location.hash.includes("tgWebAppData")) {
        window.location.hash = "tgWebAppData=" + tg.initData;
      }
    } catch (_) {}
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ProviderErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PrivyAuthProvider>
          <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
            <TelegramProvider>{children}</TelegramProvider>
          </WagmiProvider>
        </PrivyAuthProvider>
      </QueryClientProvider>
    </ProviderErrorBoundary>
  );
}
