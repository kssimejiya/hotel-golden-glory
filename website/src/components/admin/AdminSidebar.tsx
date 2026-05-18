"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarRange, BedDouble, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/admin/actions";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarRange },
  { label: "Rooms", href: "/admin/rooms", icon: BedDouble },
];

interface AdminSidebarProps {
  email: string;
}

export function AdminSidebar({ email }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border-warm bg-white lg:w-64">
      {/* Header */}
      <div className="border-b border-border-warm px-5 py-4">
        <Link href="/admin" className="block">
          <span className="font-display text-base font-bold text-charcoal">
            Golden Glory
          </span>
          <span className="block text-xs text-soft-gray">Admin Panel</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gold/10 text-gold"
                  : "text-soft-gray hover:bg-cream hover:text-charcoal"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border-warm px-3 py-4">
        <div className="mb-3 flex items-center gap-2.5 px-3">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-xs font-bold uppercase text-gold"
          >
            {email.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-soft-gray">
              Signed in
            </p>
            <p
              className="truncate text-xs font-medium text-charcoal"
              title={email}
            >
              {email}
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-soft-gray transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
        <Link
          href="/"
          className="mt-1 block rounded-lg px-3 py-2 text-xs text-soft-gray transition-colors hover:bg-cream hover:text-charcoal"
        >
          View Website
        </Link>
      </div>
    </aside>
  );
}
