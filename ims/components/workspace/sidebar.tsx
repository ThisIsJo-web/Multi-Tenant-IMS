"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "./workspace-context";
import {
  LayoutDashboard,
  Boxes,
  MapPin,
  ArrowLeftRight,
  ScrollText,
  Users,
  Settings,
  Sparkles,
  Building2,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { targetSlug, activeEnterprise, canEditWorkspace } = useWorkspace();

  const basePath = `/${targetSlug}`;

  const navItems = [
    {
      name: "Dashboard",
      href: basePath,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Products",
      href: `${basePath}/products`,
      icon: Boxes,
      exact: false,
    },
    {
      name: "Locations",
      href: `${basePath}/locations`,
      icon: MapPin,
      exact: false,
    },
    {
      name: "Operations",
      href: `${basePath}/operations`,
      icon: ArrowLeftRight,
      exact: false,
    },
    {
      name: "Stock Ledger",
      href: `${basePath}/ledger`,
      icon: ScrollText,
      exact: false,
    },
    {
      name: "Team & Roles",
      href: `${basePath}/settings/team`,
      icon: Users,
      exact: false,
    },
    {
      name: "Workspace Settings",
      href: `${basePath}/settings`,
      icon: Settings,
      exact: true,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/80 min-h-[calc(100vh-57px)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Navigation Links */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Inventory Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Workspace Quick Spec */}
        {activeEnterprise && (
          <div className="mx-1 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Active Environment
            </span>
            <span className="font-semibold text-slate-900 block truncate">
              {activeEnterprise.name}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              /{activeEnterprise.slug}
            </span>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="pt-4 border-t border-slate-100 px-2 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" />
          <span>Enterprise IMS</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400">v2.4</span>
      </div>
    </aside>
  );
}
