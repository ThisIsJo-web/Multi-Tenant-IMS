"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopNav } from "@/components/navbar/top-nav";
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Briefcase,
  Users,
  ArrowRight,
  Boxes,
} from "lucide-react";

export default function WorkspacePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeEnterprise, setActiveEnterprise] = useState<any>(null);
  const [activeMembership, setActiveMembership] = useState<any>(null);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Key operations
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRotatingKey, setIsRotatingKey] = useState(false);

  const fetchContext = async () => {
    try {
      const res = await fetch("/api/enterprise/context");
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();

      setUser(data.user);
      setActiveEnterprise(data.activeEnterprise);
      setActiveMembership(data.activeMembership);
      setEnterprises(data.enterprises || []);

      if (!data.activeEnterprise && data.user?.role !== "superadmin") {
        router.push("/enter-key");
      }
    } catch {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, []);

  const handleSwitchEnterprise = async (enterpriseId: string) => {
    try {
      const res = await fetch("/api/enterprise/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseId }),
      });
      if (res.ok) {
        await fetchContext();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRotateKey = async () => {
    if (!activeEnterprise) return;
    if (!confirm(`Are you sure you want to regenerate the Enterprise Key for ${activeEnterprise.name}? The previous key will stop working immediately.`)) {
      return;
    }

    setIsRotatingKey(true);
    try {
      const res = await fetch("/api/enterprise/rotate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseId: activeEnterprise.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to rotate key");

      setActiveEnterprise((prev: any) => ({ ...prev, enterpriseKey: data.enterprise.enterpriseKey }));
      alert(`Enterprise Key regenerated: ${data.enterprise.enterpriseKey}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRotatingKey(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center text-slate-500 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Loading workspace...
      </div>
    );
  }

  const isManager = activeMembership?.role === "manager";
  const isSuperAdmin = user.role === "superadmin";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-slate-200">
      <TopNav
        user={user}
        activeEnterprise={activeEnterprise}
        enterprises={enterprises}
        onSwitchEnterprise={handleSwitchEnterprise}
      />

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Workspace Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-950">
                  {activeEnterprise?.name || "Global Workspace"}
                </h1>
                {activeEnterprise && (
                  <span className="text-xs font-mono text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                    /{activeEnterprise.slug}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Active Tenant ID:{" "}
                <code className="text-slate-700 font-mono">{activeEnterprise?.id || "None"}</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Your Scoped Role:</span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-slate-900 text-white">
                {activeMembership?.role || (isSuperAdmin ? "SuperAdmin" : "Member")}
              </span>
            </div>
          </div>

          {/* Enterprise Key Card & Permissions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Enterprise Key Card */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-700" />
                  Enterprise Access Key
                </span>
                <span className="text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  ENT-XXXX-XXXX-XXXX
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 font-mono text-sm tracking-wider bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 flex items-center justify-between select-all">
                  <span>
                    {showKey
                      ? activeEnterprise?.enterpriseKey || "Restricted to Managers"
                      : activeEnterprise?.enterpriseKey
                      ? "ENT-••••-••••-••••"
                      : "Restricted to Managers"}
                  </span>
                  {activeEnterprise?.enterpriseKey && (
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={showKey ? "Hide key" : "Show key"}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {activeEnterprise?.enterpriseKey && (
                  <button
                    onClick={() => copyToClipboard(activeEnterprise.enterpriseKey!)}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey ? "Copied" : "Copy"}</span>
                  </button>
                )}
              </div>

              {(isManager || isSuperAdmin) && (
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500">Regenerate key if rotated:</span>
                  <button
                    onClick={handleRotateKey}
                    disabled={isRotatingKey}
                    className="text-xs text-rose-700 hover:text-rose-800 font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRotatingKey ? "animate-spin" : ""}`} />
                    <span>Rotate Key</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic Permissions */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-4">
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Scoped Permissions Granted:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(activeMembership?.permissions || ["stock:view"]).map((perm: string) => (
                  <span
                    key={perm}
                    className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-xs flex items-center gap-1 shadow-2xs"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    {perm}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                Permissions dynamically authorize inventory, shipment, and stock operations.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        {(isManager || user.canCreateEnterprise || isSuperAdmin) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link
              href="/manager"
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-xs transition group block"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Manager Portal</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage enterprise staffs, assign inventory permissions, and register new enterprises.
              </p>
            </Link>

            {isSuperAdmin && (
              <Link
                href="/superadmin"
                className="bg-white rounded-2xl border border-amber-200/90 p-5 hover:border-amber-300 hover:shadow-xs transition group block"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span>SuperAdmin Console</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Review pending managerial role applications, manage all users and platform state.
                </p>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
