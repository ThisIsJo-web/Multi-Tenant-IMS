"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Layers,
  ChevronDown,
  LogOut,
  Shield,
  Briefcase,
  FileCheck,
} from "lucide-react";

interface TopNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "superadmin" | "manager" | "user";
    canCreateEnterprise: boolean;
  };
  activeEnterprise?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  enterprises?: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
  onSwitchEnterprise?: (enterpriseId: string) => void;
}

export function TopNav({
  user,
  activeEnterprise,
  enterprises = [],
  onSwitchEnterprise,
}: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const isSuperAdmin = user.role === "superadmin";
  const isManager = user.role === "manager";

  const handleSignOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-6">
        {/* Brand */}
        <Link href="/workspace" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-base text-slate-950">Koll</span>
            <span className="ml-1.5 text-xs text-slate-700 font-medium px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
              Enterprise
            </span>
          </div>
        </Link>

        {/* Enterprise Selector Dropdown */}
        {enterprises.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-xs font-medium text-slate-800 transition shadow-2xs cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeEnterprise?.name || "Select Enterprise"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showDropdown && (
              <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl border border-slate-200 shadow-lg p-2 z-50">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Your Enterprises
                </div>
                <div className="space-y-1">
                  {enterprises.map((ent) => (
                    <button
                      key={ent.id}
                      onClick={() => {
                        onSwitchEnterprise?.(ent.id);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                        activeEnterprise?.id === ent.id
                          ? "bg-slate-900 text-white font-medium"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="truncate">{ent.name}</span>
                      <span
                        className={`text-[10px] px-1 rounded ${
                          activeEnterprise?.id === ent.id
                            ? "bg-slate-800 text-slate-300"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {ent.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modular Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/workspace"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              pathname === "/workspace"
                ? "bg-slate-100 text-slate-900 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Workspace
          </Link>

          {(isManager || isSuperAdmin) && (
            <Link
              href="/manager"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                pathname === "/manager"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Manager Portal</span>
            </Link>
          )}

          {!isManager && !isSuperAdmin && !activeEnterprise && (
            <Link
              href="/apply-manager"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                pathname === "/apply-manager"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Apply for Manager</span>
            </Link>
          )}

          {isSuperAdmin && (
            <Link
              href="/superadmin"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                pathname === "/superadmin"
                  ? "bg-amber-100/70 text-amber-900 font-semibold"
                  : "text-amber-800 hover:bg-amber-50"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              <span>SuperAdmin</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end text-right hidden sm:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-900">{user.name}</span>
            {isSuperAdmin ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">
                SuperAdmin
              </span>
            ) : isManager ? (
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold">
                Manager
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium">
                Staff
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">{user.email}</span>
        </div>

        <button
          onClick={handleSignOut}
          title="Sign Out"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
