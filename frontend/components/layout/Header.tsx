"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { clsx } from "clsx";

const NAV = [
  { href: "/dashboard",          label: "Обзор"   },
  { href: "/dashboard/levels",   label: "Уровни улиев"  },
  { href: "/dashboard/matrix",   label: "Пчелиный Рой" },
  { href: "/dashboard/payments", label: "Платежи" },
];

export function Header() {
  const path = usePathname();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 md:px-6"
      style={{
        background: "rgba(6,6,15,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mr-8 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
          style={{ background: "linear-gradient(135deg, #F5A623, #FF8C00)" }}
        >
          🐝
        </div>
        <span className="font-black text-base tracking-tight text-white hidden sm:block">
          BEE<span className="text-gold">HIVE</span>
        </span>
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-1 flex-1">
        {NAV.map(({ href, label }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-white/8 text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto">
        <ConnectButton />
      </div>
    </header>
  );
}
