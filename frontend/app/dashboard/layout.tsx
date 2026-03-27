"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { usePrivyAuth } from "@/components/providers/PrivyContext";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { isAuthenticated, isLoading } = usePrivyAuth();
  // Wait for Privy to finish loading before checking auth —
  // avoids race where isAuthenticated is briefly false on mount.
  const [privyReady, setPrivyReady] = useState(false);

  useEffect(() => {
    if (!isLoading) setPrivyReady(true);
  }, [isLoading]);

  useEffect(() => {
    if (privyReady && !isConnected && !isAuthenticated) router.push("/");
  }, [privyReady, isConnected, isAuthenticated, router]);

  return (
    <LanguageProvider>
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <div className="flex flex-1 pt-16">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] overflow-y-auto border-r border-white/10">
            <Sidebar />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
    </LanguageProvider>
  );
}
