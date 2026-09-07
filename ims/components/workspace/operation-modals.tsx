"use client";

import React, { useState, useEffect } from "react";
import { ProductItem, WarehouseLocation } from "@/types/inventory";
import {
  X,
  PackagePlus,
  ArrowRightLeft,
  PackageMinus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// ==========================================
// 1. INBOUND: RECEIVE STOCK MODAL
// ==========================================

interface ReceiveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: ProductItem[];
  locations: WarehouseLocation[];
  initialSku?: string;
}

export function ReceiveStockModal({
  isOpen,
  onClose,
  onSuccess,
  products,
  locations,
  initialSku,
}: ReceiveStockModalProps) {
  const [sku, setSku] = useState(initialSku || products[0]?.sku || "");
  const [destLocationId, setDestLocationId] = useState(locations[0]?.id || "");
  const [quantity, setQuantity] = useState("10");
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSku) setSku(initialSku);
    else if (products.length > 0 && !sku) setSku(products[0].sku);
    if (locations.length > 0 && !destLocationId) setDestLocationId(locations[0].id);
    setError(null);
  }, [isOpen, initialSku, products, locations, sku, destLocationId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/stock/operations/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku,
          destinationLocationId: destLocationId,
          quantity: Number(quantity),
          reference: reference.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to receive stock");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.sku === sku);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-950">Inbound — Receive Stock</h2>
              <p className="text-[11px] text-slate-500">Record incoming shipments into warehouse storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PO / Supplier Ref */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Supplier PO # / Delivery Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-9092 or Pacific Supplies"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            />
          </div>

          {/* Select Product */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            >
              {products.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.sku} — {p.name} (On Hand: {p.onHand} {p.baseUnit})
                </option>
              ))}
            </select>
          </div>

          {/* Destination Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Destination Location <span className="text-rose-500">*</span>
            </label>
            <select
              value={destLocationId}
              onChange={(e) => setDestLocationId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type} - {loc.code})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quantity Received ({selectedProduct?.baseUnit || "Units"}) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{isSubmitting ? "Processing..." : "Confirm Receipt"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. TRANSFER STOCK MODAL
// ==========================================

interface TransferStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: ProductItem[];
  locations: WarehouseLocation[];
  initialSku?: string;
}

export function TransferStockModal({
  isOpen,
  onClose,
  onSuccess,
  products,
  locations,
  initialSku,
}: TransferStockModalProps) {
  const [sku, setSku] = useState(initialSku || products[0]?.sku || "");
  const [fromLocationId, setFromLocationId] = useState(locations[0]?.id || "");
  const [toLocationId, setToLocationId] = useState(locations[1]?.id || locations[0]?.id || "");
  const [quantity, setQuantity] = useState("5");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSku) setSku(initialSku);
    else if (products.length > 0 && !sku) setSku(products[0].sku);
    if (locations.length > 0) {
      if (!fromLocationId) setFromLocationId(locations[0].id);
      if (!toLocationId) setToLocationId(locations[1]?.id || locations[0].id);
    }
    setError(null);
  }, [isOpen, initialSku, products, locations, sku, fromLocationId, toLocationId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/stock/operations/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku,
          fromLocationId,
          toLocationId,
          quantity: Number(quantity),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to transfer stock");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.sku === sku);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-950">Transfer Stock</h2>
              <p className="text-[11px] text-slate-500">Relocate items between enterprise bins and shelves</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            >
              {products.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.sku} — {p.name} (Total: {p.onHand} {p.baseUnit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                From Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={fromLocationId}
                onChange={(e) => setFromLocationId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
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
                To Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} disabled={loc.id === fromLocationId}>
                    {loc.name} {loc.id === fromLocationId ? "(Source)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quantity to Relocate ({selectedProduct?.baseUnit || "Units"}) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
              <span>{isSubmitting ? "Transferring..." : "Confirm Transfer"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. OUTBOUND: DISPATCH STOCK MODAL
// ==========================================

interface DispatchStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: ProductItem[];
  locations: WarehouseLocation[];
  initialSku?: string;
}

export function DispatchStockModal({
  isOpen,
  onClose,
  onSuccess,
  products,
  locations,
  initialSku,
}: DispatchStockModalProps) {
  const [sku, setSku] = useState(initialSku || products[0]?.sku || "");
  const [fromLocationId, setFromLocationId] = useState(locations[0]?.id || "");
  const [quantity, setQuantity] = useState("2");
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSku) setSku(initialSku);
    else if (products.length > 0 && !sku) setSku(products[0].sku);
    if (locations.length > 0 && !fromLocationId) setFromLocationId(locations[0].id);
    setError(null);
  }, [isOpen, initialSku, products, locations, sku, fromLocationId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/stock/operations/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku,
          fromLocationId,
          quantity: Number(quantity),
          reference: reference.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to dispatch stock");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.sku === sku);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
              <PackageMinus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-950">Outbound — Dispatch Stock</h2>
              <p className="text-[11px] text-slate-500">Record inventory outgoing for orders and customer fulfillment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Order Reference / Customer / Invoice #
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Order #PO-8821 or Apex Jobsite"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            >
              {products.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.sku} — {p.name} (Available ATP: {p.availableStock} {p.baseUnit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Source Location <span className="text-rose-500">*</span>
            </label>
            <select
              value={fromLocationId}
              onChange={(e) => setFromLocationId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Dispatch Quantity ({selectedProduct?.baseUnit || "Units"}) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PackageMinus className="w-3.5 h-3.5" />}
              <span>{isSubmitting ? "Dispatching..." : "Confirm Dispatch"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
