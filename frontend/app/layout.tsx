import type { Metadata, Viewport } from "next";
import "./globals.css";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";

// Disable SSR for the Web3Provider — Privy/wagmi SDKs access browser APIs
// (window, crypto, localStorage) and crash during server-side rendering.
const Web3Provider = dynamic(
  () => import("@/components/providers/Web3Provider").then((m) => m.Web3Provider),
  { ssr: false }
);

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "META BEE HIVE — Децентрализованная реферальная матрица",
  description: "Зарабатывай вместе с роем. Матрица S4 на Polygon + DAI.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full">
      <body className="min-h-full bg-bg text-white antialiased tg-safe-area">
        <Web3Provider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0F1F3D",
                color:      "#fff",
                border:     "1px solid rgba(245,166,35,0.3)",
              },
              success: { iconTheme: { primary: "#27AE60", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#E94560", secondary: "#fff" } },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  );
}
