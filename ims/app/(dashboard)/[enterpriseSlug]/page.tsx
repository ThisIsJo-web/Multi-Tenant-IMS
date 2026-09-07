"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWorkspace } from "@/components/workspace/workspace-context";
import {
  DashboardSummary,
  ProductItem,
  WarehouseLocation,
} from "@/types/inventory";
import {
  Boxes,
  Layers,
  AlertTriangle,
  ArrowRightLeft,
  PackagePlus,
  PackageMinus,
  RefreshCw,
  Plus,
  ArrowRight,
  Clock,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import {
  ReceiveStockModal,
  TransferStockModal,
} from "@/components/workspace/operation-modals";
import { ProductModal } from "@/components/workspace/product-modal";

export default function DashboardPage() {
  const { targetSlug, activeEnterprise } = useWorkspace();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [reorderSku, setReorderSku] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, prodRes, locRes] = await Promise.all([
        fetch("/api/stock/summary"),
        fetch("/api/stock/products"),
        fetch("/api/stock/locations"),
      ]);

      if (summaryRes.ok) {
        const sumData = await summaryRes.json();
        setSummary(sumData);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
      if (locRes.ok) {
        const locData = await locRes.json();
        setLocations(locData);
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuickReorder = (sku: string) => {
    setReorderSku(sku);
    setIsReceiveOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs text-slate-500">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Loading dashboard metrics...
      </div>
    );
  }

  const lowStockItems = summary?.itemsNeedingReorder || [];
  const recentLogs = summary?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
            <span>Dashboard Overview</span>
            <span className="text-xs font-normal text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time inventory levels, reorder alerts, and daily movements for{" "}
            <span className="font-semibold text-slate-800">{activeEnterprise?.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setReorderSku(undefined);
              setIsReceiveOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Receive Stock</span>
          </button>

          <button
            onClick={() => setIsTransferOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Transfer</span>
          </button>

          <button
            onClick={() => setIsAddProductOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add SKU</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKUs */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total SKUs</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-950 font-mono">
              {summary?.totalSkus?.toLocaleString() || 0}
            </span>
            <span className="text-xs text-slate-500 ml-1.5">active items</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Across {locations.length} warehouse locations
          </div>
        </div>

        {/* Total Physical Stock */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Physical Stock</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-950 font-mono">
              {summary?.totalStock?.toLocaleString() || 0}
            </span>
            <span className="text-xs text-slate-500 ml-1.5">units</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium">
            Available to Promise (ATP) tracked
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Low Stock Alerts</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-950 font-mono">
              {summary?.lowStockAlertsCount || 0}
            </span>
            {Number(summary?.lowStockAlertsCount) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                Action Needed
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Stock at or below reorder threshold
          </div>
        </div>

        {/* Moves Today */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Moves Today</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-950 font-mono">
              {summary?.movesToday || 0}
            </span>
            <span className="text-xs text-slate-500 ml-1.5">transactions</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Receipts, transfers, & dispatches
          </div>
        </div>
      </div>

      {/* Main Grid: Low Stock Reorders & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Items Needing Reorder (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-950">Items Needing Reorder</h2>
            </div>
            <Link
              href={`/${targetSlug}/products`}
              className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 transition"
            >
              <span>View Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4">
            {lowStockItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-xs font-semibold text-slate-700">Healthy Stock Levels</p>
                <p className="text-[11px] mt-0.5">All products meet or exceed their reorder thresholds.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.sku}
                    className="p-3.5 rounded-xl border border-amber-200/70 bg-amber-50/40 hover:bg-amber-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-slate-900">
                          {item.sku}
                        </span>
                        <span className="font-semibold text-xs text-slate-900">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                        <span>
                          On Hand:{" "}
                          <strong className="text-rose-600 font-mono">
                            {item.onHand} {item.baseUnit}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Available (ATP):{" "}
                          <strong className="font-mono text-slate-800">
                            {item.availableStock} {item.baseUnit}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Min Required:{" "}
                          <strong className="font-mono text-slate-800">
                            {item.reorderThreshold} {item.baseUnit}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleQuickReorder(item.sku)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 text-xs font-semibold transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <PackagePlus className="w-3.5 h-3.5 text-amber-700" />
                      <span>Reorder</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-950">Recent Activity Feed</h2>
            </div>
            <Link
              href={`/${targetSlug}/ledger`}
              className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 transition"
            >
              <span>Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[420px]">
            {recentLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs">No movements recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => {
                  const isReceipt = log.action === "RECEIPT";
                  const isTransfer = log.action === "TRANSFER";
                  const isDispatch = log.action === "DISPATCH";

                  const badgeBg = isReceipt
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : isTransfer
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : isDispatch
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-700 border-slate-200";

                  const timeAgo = new Date(log.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50/60 border border-slate-200/70 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${badgeBg}`}
                        >
                          {log.action}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {timeAgo}
                        </span>
                      </div>

                      <div className="text-slate-800 font-medium pt-0.5">
                        <span className="font-semibold text-slate-950">{log.performedBy}</span>{" "}
                        {isReceipt && "received"}{" "}
                        {isTransfer && "transferred"}{" "}
                        {isDispatch && "dispatched"}{" "}
                        <span className="font-mono font-semibold text-slate-900">
                          {Math.abs(log.quantity)}x
                        </span>{" "}
                        &quot;{log.productName}&quot;
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span>{log.fromLocation}</span>
                        <span>→</span>
                        <span>{log.toLocation}</span>
                        {log.reference && (
                          <span className="text-slate-400 font-mono text-[10px] ml-auto">
                            ({log.reference})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ReceiveStockModal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        onSuccess={fetchData}
        products={products}
        locations={locations}
        initialSku={reorderSku}
      />

      <TransferStockModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onSuccess={fetchData}
        products={products}
        locations={locations}
      />

      <ProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSaved={fetchData}
        locations={locations}
      />
    </div>
  );
}
