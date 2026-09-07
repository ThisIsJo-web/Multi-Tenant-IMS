"use client";

import React from "react";
import Link from "next/link";
import { useWorkspace } from "./workspace-context";
import {
  ShieldAlert,
  KeyRound,
  Building2,
  ArrowRight,
  RefreshCw,
  Layers,
} from "lucide-react";

interface WorkspaceGuardProps {
  children: React.ReactNode;
}

export function WorkspaceGuard({ children }: WorkspaceGuardProps) {
  const {
    user,
    activeEnterprise,
    enterprises,
    isLoading,
    targetSlug,
    switchEnterprise,
  } = useWorkspace();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center text-slate-500 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-slate-900 mb-3" />
        <span className="font-medium text-slate-600">Connecting to enterprise workspace...</span>
        <span className="text-[11px] text-slate-400 mt-1">Verifying scoped tenant permissions</span>
      </div>
    );
  }

  // 1. User has no enterprise memberships at all
  if (!enterprises || enterprises.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-950">Enterprise Access Required</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            You do not currently belong to any enterprise workspace. To access the inventory management system, please join an enterprise with an access key or apply for a manager role.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href="/enter-key"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Enter Enterprise Access Key</span>
            </Link>

            {user?.canCreateEnterprise ? (
              <Link
                href="/manager"
                className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Create Enterprise</span>
              </Link>
            ) : (
              <Link
                href="/apply-manager"
                className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Apply for Manager Role</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. User is in enterprises, but not a member of this specific slug
  const belongsToThisSlug = enterprises.some((e) => e.slug === targetSlug);
  const isSuperAdmin = user?.role === "superadmin";

  if (!belongsToThisSlug && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-950">Restricted Workspace</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            You do not have membership access to <span className="font-semibold text-slate-900">/{targetSlug}</span>.
            Switch to one of your active enterprise workspaces below:
          </p>

          <div className="mt-5 space-y-2 text-left">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              Your Available Workspaces
            </div>
            {enterprises.map((ent) => (
              <button
                key={ent.id}
                onClick={() => switchEnterprise(ent.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                    <Layers className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">{ent.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">/{ent.slug}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-900 transition" />
              </button>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <Link
              href="/enter-key"
              className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Join this workspace with an Enterprise Key</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. User is authorized
  return <>{children}</>;
}
