import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { Toaster } from "react-hot-toast";
import Script from "next/script";

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
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
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
