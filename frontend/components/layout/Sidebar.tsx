"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard, Layers, Grid2X2,
  History, Users, Trophy, Globe,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",                  icon: LayoutDashboard, label: "Обзор"        },
  { href: "/dashboard/levels",           icon: Layers,          label: "Уровни улиев" },
  { href: "/dashboard/matrix",           icon: Grid2X2,         label: "Пчелиный Рой" },
  { href: "/dashboard/payments",         icon: History,         label: "Платежи"      },
  { href: "/dashboard/team",             icon: Users,           label: "Моя Пасека"   },
  { href: "/dashboard/achievements",     icon: Trophy,          label: "Достижения"   },
  { href: "/dashboard/language",         icon: Globe,           label: "Язык"         },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <div className="h-full px-3 py-6 flex flex-col gap-1">
      {NAV.map(({ href, icon: Icon, label }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
              active
                ? "bg-white/8 text-white"
                : "text-white/35 hover:text-white/70 hover:bg-white/5"
            )}
          >
            <div className={clsx(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
              active ? "bg-gold/20" : "bg-white/5 group-hover:bg-white/8"
            )}>
              <Icon className={clsx("w-4 h-4", active ? "text-gold" : "text-white/40 group-hover:text-white/60")} />
            </div>
            {label}
            {active && (
              <div className="ml-auto w-1 h-4 rounded-full bg-gold" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
