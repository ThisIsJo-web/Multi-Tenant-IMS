"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspace } from "./workspace-context";
import {
  Building2,
  KeyRound,
  Copy,
  Check,
  ChevronDown,
  Layers,
  Settings,
  LogOut,
  User,
  Shield,
  Sparkles,
  Edit3,
} from "lucide-react";

export function TopBar() {
  const router = useRouter();
  const {
    user,
    activeEnterprise,
    activeMembership,
    enterprises,
    canEditWorkspace,
    openEditModal,
    switchEnterprise,
  } = useWorkspace();

  const [copiedKey, setCopiedKey] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const copyKey = () => {
    if (!activeEnterprise?.enterpriseKey) return;
    navigator.clipboard.writeText(activeEnterprise.enterpriseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/login");
  };

  const roleName = activeMembership?.role === "manager"
    ? "Manager"
    : user?.role === "superadmin"
    ? "SuperAdmin"
    : "Staff";

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3 flex items-center justify-between">
      {/* Left: Enterprise Branding & Key */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Active Enterprise Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
            {activeEnterprise?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeEnterprise.logo}
                alt={activeEnterprise.name}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <Building2 className="w-4 h-4 text-slate-100" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-950 text-sm tracking-tight">
                {activeEnterprise?.name || "Enterprise Workspace"}
              </span>
              <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                /{activeEnterprise?.slug}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <span>Tenant ID:</span>
              <code className="text-[10px] text-slate-700 font-mono">
                {activeEnterprise?.id ? `${activeEnterprise.id.slice(0, 8)}...` : "None"}
              </code>
            </div>
          </div>
        </div>

        {/* Enterprise Key (Copyable) */}
        {activeEnterprise?.enterpriseKey && (
          <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-lg pl-2.5 pr-1 py-1 text-xs text-slate-700 gap-2 shadow-2xs">
            <KeyRound className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-mono text-[11px] tracking-wider text-slate-900 font-medium">
              {activeEnterprise.enterpriseKey}
            </span>
            <button
              onClick={copyKey}
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-md border border-transparent hover:border-slate-200 transition cursor-pointer"
              title="Copy Enterprise Key"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Workspace Switcher */}
        {enterprises.length > 1 && (
          <div className="relative">
            <button
              onClick={() => {
                setShowWorkspaceMenu(!showWorkspaceMenu);
                setShowUserMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-xs font-medium text-slate-700 transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Switch</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl border border-slate-200 shadow-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Your Enterprises
                </div>
                <div className="space-y-1">
                  {enterprises.map((ent) => (
                    <button
                      key={ent.id}
                      onClick={() => {
                        switchEnterprise(ent.id);
                        setShowWorkspaceMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                        activeEnterprise?.id === ent.id
                          ? "bg-slate-900 text-white font-medium"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="truncate">{ent.name}</span>
                      <span className={`text-[10px] uppercase font-mono ${activeEnterprise?.id === ent.id ? "text-slate-300" : "text-slate-400"}`}>
                        {ent.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Workspace Editing (Manager) & User Profile */}
      <div className="flex items-center gap-3">
        {/* Edit Workspace Quick Action (Managers & SuperAdmin Only) */}
        {canEditWorkspace && (
          <button
            onClick={openEditModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-800 transition shadow-2xs cursor-pointer"
            title="Edit workspace metadata, branding, and access key"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Edit Workspace</span>
          </button>
        )}

        {/* User Info & Scoped Role */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowWorkspaceMenu(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shadow-2xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {user?.name || "User"}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {roleName}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-950 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {roleName}
                  </span>
                </div>
              </div>

              {canEditWorkspace && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    openEditModal();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span>Workspace Settings</span>
                </button>
              )}

              {user?.role === "superadmin" && (
                <Link
                  href="/superadmin"
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SuperAdmin Console</span>
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer mt-1 border-t border-slate-100"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
