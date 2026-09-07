"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ProductItem, WarehouseLocation } from "@/types/inventory";
import {
  ArrowLeftRight,
  PackagePlus,
  PackageMinus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Layers,
} from "lucide-react";

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<"receive" | "transfer" | "dispatch">("receive");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [reference, setReference] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDependencies = useCallback(async () => {
    try {
      const [prodRes, locRes] = await Promise.all([
        fetch("/api/stock/products"),
        fetch("/api/stock/locations"),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
        if (prodData.length > 0 && !sku) setSku(prodData[0].sku);
      }
      if (locRes.ok) {
        const locData = await locRes.json();
        setLocations(locData);
        if (locData.length > 0) {
          if (!toLocationId) setToLocationId(locData[0].id);
          if (!fromLocationId) setFromLocationId(locData[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load operations dependencies", e);
    } finally {
      setIsLoading(false);
    }
  }, [sku, toLocationId, fromLocationId]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  const selectedProduct = products.find((p) => p.sku === sku);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const qtyNum = Number(quantity);
      if (qtyNum <= 0) throw new Error("Quantity must be greater than zero");

      let endpoint = "/api/stock/operations/receive";
      let payload: any = { sku, quantity: qtyNum };

      if (activeTab === "receive") {
        endpoint = "/api/stock/operations/receive";
        payload.destinationLocationId = toLocationId;
        payload.reference = reference.trim() || undefined;
      } else if (activeTab === "transfer") {
        endpoint = "/api/stock/operations/transfer";
        payload.fromLocationId = fromLocationId;
        payload.toLocationId = toLocationId;
      } else if (activeTab === "dispatch") {
        endpoint = "/api/stock/operations/dispatch";
        payload.fromLocationId = fromLocationId;
        payload.reference = reference.trim() || undefined;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Operation failed");

      setSuccessMsg(
        activeTab === "receive"
          ? `Successfully received ${qtyNum}x of ${sku}. Product stock updated.`
          : activeTab === "transfer"
          ? `Successfully relocated ${qtyNum}x units from source to destination location.`
          : `Successfully dispatched ${qtyNum}x of ${sku}. Physical on-hand reduced.`
      );

      setReference("");
      await fetchDependencies();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
          <ArrowLeftRight className="w-5 h-5 text-slate-900" />
          <span>Operations Hub</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Perform inbound supplier intake, inter-warehouse transfers, and customer fulfillment dispatches
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => {
            setActiveTab("receive");
            setSuccessMsg(null);
            setErrorMsg(null);
          }}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeTab === "receive"
              ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === "receive" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>
              <PackagePlus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-semibold uppercase">
              + Inbound
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Receive Stock</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Supplier shipments & intake</span>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab("transfer");
            setSuccessMsg(null);
            setErrorMsg(null);
          }}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeTab === "transfer"
              ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === "transfer" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}>
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-blue-700 font-semibold uppercase">
              ⇄ Relocate
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Transfer Stock</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Move between bins & shelves</span>
          </div>
        </button>

        <button
          onClick={() => {
            setActiveTab("dispatch");
            setSuccessMsg(null);
            setErrorMsg(null);
          }}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeTab === "dispatch"
              ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === "dispatch" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700"}`}>
              <PackageMinus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-amber-700 font-semibold uppercase">
              - Outbound
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Dispatch Stock</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Customer orders & fulfillment</span>
          </div>
        </button>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Reference Field (Receive & Dispatch) */}
          {activeTab !== "transfer" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {activeTab === "receive"
                  ? "Supplier PO # / Packing Slip Reference"
                  : "Customer Order # / Dispatch Reference"}
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={activeTab === "receive" ? "e.g. PO-9092" : "e.g. Order #PO-8821"}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              />
            </div>
          )}

          {/* Product Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Select Product SKU <span className="text-rose-500">*</span>
              </label>
              {selectedProduct && (
                <span className="text-[11px] text-slate-500">
                  On Hand: <strong className="font-mono text-slate-900">{selectedProduct.onHand}</strong> • ATP:{" "}
                  <strong className="font-mono text-emerald-600">{selectedProduct.availableStock}</strong> {selectedProduct.baseUnit}
                </span>
              )}
            </div>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            >
              {products.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.sku} — {p.name} (On Hand: {p.onHand} {p.baseUnit})
                </option>
              ))}
            </select>
          </div>

          {/* Location Selectors */}
          {activeTab === "receive" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Destination Storage Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type} - {loc.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "transfer" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  From Location (Source) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={fromLocationId}
                  onChange={(e) => setFromLocationId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  To Location (Target) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={toLocationId}
                  onChange={(e) => setToLocationId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id} disabled={loc.id === fromLocationId}>
                      {loc.name} {loc.id === fromLocationId ? "(Source)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === "dispatch" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                From Location (Pick Source) <span className="text-rose-500">*</span>
              </label>
              <select
                value={fromLocationId}
                onChange={(e) => setFromLocationId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quantity to {activeTab === "receive" ? "Receive" : activeTab === "transfer" ? "Move" : "Dispatch"}{" "}
              ({selectedProduct?.baseUnit || "Units"}) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            />
          </div>

          {/* Submission Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50 ${
                activeTab === "receive"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : activeTab === "transfer"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : activeTab === "receive" ? (
                <PackagePlus className="w-4 h-4" />
              ) : activeTab === "transfer" ? (
                <ArrowLeftRight className="w-4 h-4" />
              ) : (
                <PackageMinus className="w-4 h-4" />
              )}
              <span>
                {isSubmitting
                  ? "Submitting to Ledger..."
                  : activeTab === "receive"
                  ? "Submit Inbound Receipt"
                  : activeTab === "transfer"
                  ? "Execute Inter-Location Transfer"
                  : "Confirm Outbound Dispatch"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
