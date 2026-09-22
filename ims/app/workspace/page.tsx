"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Store,
  ShieldCheck,
  X,
  RefreshCw,
  ChevronDown,
  Activity,
  Database,
  LayoutGrid,
  Package,
  MapPin,
  Settings,
  LogOut,
  Server,
  Wifi,
} from "lucide-react";
import { AppId, WindowState, APP_META } from "@/components/workspace/vm-types";
import { AppWindow } from "@/components/workspace/vm-window";
import { ModuleCard } from "@/components/workspace/vm-module-card";

let zCounter = 200;

// ─── Live Clock ─────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono text-[11px] font-semibold text-slate-500 tracking-wider">
      {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
    </span>
  );
}

// ─── Main VM Desktop Page ────────────────────────────────────────────────────
export default function VMWorkspacePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeEnterprise, setActiveEnterprise] = useState<any>(null);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [showHome, setShowHome] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEnterpriseMenu, setShowEnterpriseMenu] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [isDraggingAny, setIsDraggingAny] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const entMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/enterprise/context");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setActiveEnterprise(data.activeEnterprise);
        setEnterprises(data.enterprises || []);

        if (!data.activeEnterprise && data.user?.role !== "superadmin") {
          router.push("/enter-key");
          return;
        }

        if (data.activeEnterprise) {
          try {
            const sr = await fetch("/api/stock/summary", {
              headers: { "x-enterprise-id": data.activeEnterprise.id },
            });
            if (sr.ok) setSummary(await sr.json());
          } catch {
            /* non-critical */
          }
        }
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (entMenuRef.current && !entMenuRef.current.contains(e.target as Node)) {
        setShowEnterpriseMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isSuperAdmin = user?.role === "superadmin";
  const isPosEnabled = activeEnterprise?.metadata?.posEnabled !== false;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getDateStr = () =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getCenterPos = (w: number, h: number) => ({
    x: Math.max(0, (typeof window !== "undefined" ? window.innerWidth - w : 800) / 2),
    y: Math.max(44, (typeof window !== "undefined" ? window.innerHeight - h : 600) / 2),
  });

  const openApp = useCallback(
    (appId: AppId) => {
      const existing = windows.find((w) => w.appId === appId);
      if (existing) {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === existing.id ? { ...w, isMinimized: false, zIndex: ++zCounter } : w
          )
        );
        setShowHome(false);
        return;
      }

      const meta = APP_META[appId];
      const { x, y } = getCenterPos(meta.defaultW, meta.defaultH);
      let src = "/workspace";
      if (appId === "workspace" && activeEnterprise) src = `/${activeEnterprise.slug}`;
      else if (appId === "pos" && activeEnterprise) src = `/pos/${activeEnterprise.slug}`;
      else if (appId === "manager") src = "/manager";
      else if (appId === "superadmin") src = "/superadmin";

      setWindows((prev) => [
        ...prev,
        {
          id: `${appId}-${Date.now()}`,
          appId,
          title: meta.label,
          subtitle: meta.module,
          isMaximized: false,
          isMinimized: false,
          zIndex: ++zCounter,
          x,
          y,
          width: meta.defaultW,
          height: meta.defaultH,
          src,
        },
      ]);
      setShowHome(false);
    },
    [windows, activeEnterprise]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, isMaximized: !w.isMaximized, zIndex: ++zCounter }
          : w
      )
    );
  }, []);

  const bringToFront = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: ++zCounter } : w))
    );
  }, []);

  const updatePosition = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const handleSwitchEnterprise = async (id: string) => {
    await fetch("/api/enterprise/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enterpriseId: id }),
    });
    window.location.reload();
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex flex-col items-center justify-center text-slate-500 text-xs">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mb-4 text-slate-900">
          <Boxes className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-slate-800" />
          <span>Connecting to Workspace Virtual Desktop...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#f8fafc] text-slate-900 select-none"
      style={{
        backgroundImage: "radial-gradient(#cbd5e1 0.75px, transparent 0.75px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* ═══════════════════════════════════════════ */}
      {/* TOP MENU BAR (TASKBAR)                      */}
      {/* ═══════════════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 h-11 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 flex items-center justify-between z-[9999] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Left: Branding & Running Windows */}
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHome(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition cursor-pointer shrink-0"
          >
            <Boxes className="w-3.5 h-3.5 text-white" />
            <span>Koll IMS</span>
          </button>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          {/* Running Windows Taskbar Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {windows.map((win) => {
              const meta = APP_META[win.appId];
              const isActive = !win.isMinimized;
              return (
                <button
                  type="button"
                  key={win.id}
                  onClick={() => {
                    if (win.isMinimized) {
                      setWindows((prev) =>
                        prev.map((w) =>
                          w.id === win.id
                            ? { ...w, isMinimized: false, zIndex: ++zCounter }
                            : w
                        )
                      );
                    } else {
                      bringToFront(win.id);
                      setShowHome(false);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-slate-100 text-slate-950 font-semibold border border-slate-200/80 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
                  }`}
                >
                  <span className="opacity-70 scale-75">{meta.icon}</span>
                  <span className="truncate max-w-[120px]">{meta.label}</span>
                  {win.isMinimized && (
                    <span className="text-[9px] px-1 rounded bg-slate-200/80 text-slate-600 font-mono">
                      MIN
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Controls: Live status, Clock, Enterprise & User */}
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-emerald-700 tracking-wider">
              ONLINE
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200" />
          <LiveClock />
          <div className="h-4 w-px bg-slate-200" />

          {/* Enterprise Dropdown */}
          {activeEnterprise && (
            <div className="relative" ref={entMenuRef}>
              <button
                type="button"
                onClick={() => setShowEnterpriseMenu((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <span className="truncate max-w-[140px]">{activeEnterprise.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showEnterpriseMenu && enterprises.length > 1 && (
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Workspace
                  </div>
                  <div className="space-y-1 mt-1">
                    {enterprises.map((e: any) => (
                      <button
                        type="button"
                        key={e.id}
                        onClick={() => handleSwitchEnterprise(e.id)}
                        disabled={e.id === activeEnterprise.id}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                          e.id === activeEnterprise.id
                            ? "bg-slate-900 text-white font-medium"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <span className="truncate">{e.name}</span>
                        {e.id === activeEnterprise.id && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            ACTIVE
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 text-left">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                    {user?.email}
                  </div>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono font-semibold text-slate-700 uppercase">
                    {user?.role || "Staff"}
                  </span>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      openApp("manager");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>Manager Portal</span>
                  </button>
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        openApp("superadmin");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Platform Console</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* WINDOWS LAYER                               */}
      {/* ═══════════════════════════════════════════ */}
      {windows.map((win) => (
        <AppWindow
          key={win.id}
          win={win}
          isDraggingAny={isDraggingAny}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMaximize={maximizeWindow}
          onFocus={bringToFront}
          onPositionChange={updatePosition}
          onDragStart={() => setIsDraggingAny(true)}
          onDragEnd={() => setIsDraggingAny(false)}
        />
      ))}

      {/* ═══════════════════════════════════════════ */}
      {/* HOME PANEL (LAUNCHPAD)                      */}
      {/* ═══════════════════════════════════════════ */}
      {showHome && (
        <div
          className="fixed overflow-y-auto"
          style={{ top: 44, left: 0, right: 0, bottom: 34, zIndex: 50 }}
        >
          <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
            {/* Welcome Banner */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      Enterprise Resource Planning Desktop
                    </span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
                    {getGreeting()}, {user?.name?.split(" ")[0] || "User"}
                  </h1>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    {getDateStr()} · {activeEnterprise?.name || "No Enterprise Workspace"} · {user?.role?.toUpperCase() || "STAFF"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openApp("workspace")}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition cursor-pointer"
                  >
                    <Boxes className="w-4 h-4" />
                    <span>Launch Inventory</span>
                  </button>
                  {isPosEnabled && (
                    <button
                      type="button"
                      onClick={() => openApp("pos")}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs flex items-center gap-2 transition cursor-pointer"
                    >
                      <Store className="w-4 h-4 text-slate-700" />
                      <span>Launch POS</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* KPI Statistics */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total SKUs",
                    value: summary.totalProducts ?? "—",
                    icon: <Package className="w-4 h-4 text-slate-700" />,
                  },
                  {
                    label: "On-Hand Stock",
                    value: summary.totalOnHand?.toLocaleString() ?? "—",
                    icon: <Boxes className="w-4 h-4 text-slate-700" />,
                  },
                  {
                    label: "Active Locations",
                    value: summary.totalLocations ?? "—",
                    icon: <MapPin className="w-4 h-4 text-slate-700" />,
                  },
                  {
                    label: "Reorder Required",
                    value: summary.itemsNeedingReorder?.length ?? "—",
                    icon: <Activity className="w-4 h-4 text-amber-600" />,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                        {stat.label}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center">
                        {stat.icon}
                      </div>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-950 font-mono tracking-tight mt-1">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Module Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  Available Applications
                </div>
                <div className="text-xs text-slate-500">
                  Click any card to launch as a virtual desktop window
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <ModuleCard
                  appId="workspace"
                  meta={APP_META.workspace}
                  enabled={!!activeEnterprise}
                  onLaunch={() => openApp("workspace")}
                />
                <ModuleCard
                  appId="pos"
                  meta={APP_META.pos}
                  enabled={!!activeEnterprise && isPosEnabled}
                  badge={!isPosEnabled ? "DISABLED" : "LIVE"}
                  onLaunch={() => openApp("pos")}
                />
                <ModuleCard
                  appId="manager"
                  meta={APP_META.manager}
                  enabled={true}
                  onLaunch={() => openApp("manager")}
                />
                {isSuperAdmin && (
                  <ModuleCard
                    appId="superadmin"
                    meta={APP_META.superadmin}
                    enabled={true}
                    badge="RESTRICTED"
                    onLaunch={() => openApp("superadmin")}
                  />
                )}
              </div>
            </div>

            {/* System Diagnostic Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span className="font-mono text-[11px]">PostgreSQL · imsdb</span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-400" />
                  <span className="font-mono text-[11px]">NestJS API · :3001</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-slate-400" />
                  <span className="font-mono text-[11px]">Next.js Client · :3000</span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-medium text-emerald-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>All microservices operational</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* BOTTOM STATUS BAR                           */}
      {/* ═══════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 h-9 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 flex items-center justify-between z-[9999] shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
        {/* Left: Home toggle & running window mini-tabs */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHome(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              showHome
                ? "bg-slate-100 text-slate-950 font-semibold border border-slate-200 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          {windows.length > 0 && (
            <>
              <div className="h-3 w-px bg-slate-200 mx-1" />
              {windows.map((win) => {
                const meta = APP_META[win.appId];
                const isActive = !win.isMinimized;
                return (
                  <div
                    key={win.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (win.isMinimized) {
                        setWindows((prev) =>
                          prev.map((w) =>
                            w.id === win.id
                              ? { ...w, isMinimized: false, zIndex: ++zCounter }
                              : w
                          )
                        );
                      } else {
                        bringToFront(win.id);
                        setShowHome(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (win.isMinimized) {
                          setWindows((prev) =>
                            prev.map((w) =>
                              w.id === win.id
                                ? { ...w, isMinimized: false, zIndex: ++zCounter }
                                : w
                            )
                          );
                        } else {
                          bringToFront(win.id);
                          setShowHome(false);
                        }
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs transition cursor-pointer group ${
                      isActive
                        ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
                    }`}
                  >
                    <span className="scale-75 opacity-70">{meta.icon}</span>
                    <span className="truncate max-w-[100px]">{meta.label}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeWindow(win.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          closeWindow(win.id);
                        }
                      }}
                      className="ml-1 p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      title="Close Window"
                    >
                      <X className="w-2.5 h-2.5" />
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Right: Workspace Metadata */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
          {activeEnterprise && (
            <>
              <span>WORKSPACE · {activeEnterprise.name}</span>
              <span className="text-slate-300">|</span>
            </>
          )}
          <span>ROLE · {user?.role?.toUpperCase() || "STAFF"}</span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-slate-700">IMS v2.0</span>
        </div>
      </div>
    </div>
  );
}
