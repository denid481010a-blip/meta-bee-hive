"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { LayoutDashboard, Layers, Grid2X2, History, Users } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";

export function MobileNav() {
  const path = usePathname();
  const { t } = useT();

  const NAV = [
    { href: "/dashboard",          icon: LayoutDashboard, label: t.nav.overview  },
    { href: "/dashboard/levels",   icon: Layers,          label: t.nav.levels    },
    { href: "/dashboard/matrix",   icon: Grid2X2,         label: t.nav.matrix    },
    { href: "/dashboard/payments", icon: History,         label: t.nav.payments  },
    { href: "/dashboard/team",     icon: Users,           label: t.nav.team      },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden"
      style={{
        background: "rgba(6,6,15,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = path === href;
        return (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-all">
            <div className={clsx("w-9 h-7 rounded-lg flex items-center justify-center transition-all", active ? "bg-gold/15" : "")}>
              <Icon className={clsx("w-4 h-4 transition-colors", active ? "text-gold" : "text-white/25")} />
            </div>
            <span className={clsx("text-[10px] font-medium transition-colors", active ? "text-gold" : "text-white/25")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
