"use client";

import React, { useState, useEffect, useCallback } from "react";
import { StockLedgerRecord } from "@/types/inventory";
import {
  ScrollText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function StockLedgerPage() {
  const [logs, setLogs] = useState<StockLedgerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("");

  const fetchLedger = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (locationFilter) params.set("location", locationFilter);

      const res = await fetch(`/api/stock/ledger?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to load stock ledger", e);
    } finally {
      setIsLoading(false);
    }
  }, [search, actionFilter, locationFilter]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = [
      "ID",
      "Timestamp",
      "SKU",
      "Product Name",
      "Action",
      "Quantity",
      "From Location",
      "To Location",
      "Performed By",
      "Role",
      "Reference",
    ];

    const rows = logs.map((l) => [
      l.id,
      new Date(l.timestamp).toISOString(),
      `"${l.sku}"`,
      `"${l.productName.replace(/"/g, '""')}"`,
      l.action,
      l.quantity,
      `"${l.fromLocation.replace(/"/g, '""')}"`,
      `"${l.toLocation.replace(/"/g, '""')}"`,
      `"${l.performedBy.replace(/"/g, '""')}"`,
      l.performedByRole,
      `"${l.reference.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stock-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
            <ScrollText className="w-5 h-5 text-slate-900" />
            <span>Stock Ledger — Inventory Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Permanent, immutable audit statement recording every physical intake, move, and dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={logs.length === 0}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Banner / Compliance Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white">Append-Only Immutable Ledger</h2>
            <p className="text-[11px] text-slate-300">
              Transactions cannot be modified or deleted. Discrepancies must be reconciled with an adjustment entry.
            </p>
          </div>
        </div>
        <span className="hidden md:inline text-[11px] font-mono text-slate-400">
          {logs.length} Total Audit Records
        </span>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, item name, reference (PO / Order #), or user..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
          >
            <option value="ALL">All Actions</option>
            <option value="RECEIPT">RECEIPT (Inbound)</option>
            <option value="TRANSFER">TRANSFER (Relocation)</option>
            <option value="DISPATCH">DISPATCH (Outbound)</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
            <option value="AUDIT">AUDIT</option>
          </select>

          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Filter location..."
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Item / SKU</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">From Location</th>
                <th className="px-4 py-3.5">To Location</th>
                <th className="px-4 py-3.5 text-right">Quantity</th>
                <th className="px-4 py-3.5">Performed By</th>
                <th className="px-5 py-3.5">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Loading audit ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
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

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Product */}
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 block">{log.productName}</span>
                        <span className="font-mono text-[10px] text-slate-400">{log.sku}</span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeBg}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* From */}
                      <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                        {log.fromLocation}
                      </td>

                      {/* To */}
                      <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">
                        {log.toLocation}
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap font-mono font-bold">
                        <span
                          className={
                            log.quantity > 0
                              ? "text-emerald-600"
                              : log.quantity < 0
                              ? "text-rose-600"
                              : "text-slate-800"
                          }
                        >
                          {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                        </span>
                      </td>

                      {/* Performed By */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-medium text-slate-900 block">{log.performedBy}</span>
                        <span className="text-[10px] uppercase font-mono text-slate-400">
                          {log.performedByRole}
                        </span>
                      </td>

                      {/* Reference */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-500">
                        {log.reference || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
