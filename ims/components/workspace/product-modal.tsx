"use client";

import React, { useState, useEffect } from "react";
import {
  BaseUnit,
  ProductItem,
  TrackingMode,
  WarehouseLocation,
} from "@/types/inventory";
import { X, Boxes, Plus, Save, AlertCircle } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingProduct?: ProductItem | null;
  locations?: WarehouseLocation[];
}

export function ProductModal({
  isOpen,
  onClose,
  onSaved,
  editingProduct,
  locations = [],
}: ProductModalProps) {
  const isEditing = !!editingProduct;

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [baseUnit, setBaseUnit] = useState<BaseUnit>("Piece");
  const [trackingMode, setTrackingMode] = useState<TrackingMode>("Standard");
  const [reorderThreshold, setReorderThreshold] = useState("10");
  const [initialLocationId, setInitialLocationId] = useState("");
  const [initialQuantity, setInitialQuantity] = useState("0");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setSku(editingProduct.sku);
      setName(editingProduct.name);
      setBaseUnit(editingProduct.baseUnit);
      setTrackingMode(editingProduct.trackingMode);
      setReorderThreshold(editingProduct.reorderThreshold.toString());
      setInitialLocationId("");
      setInitialQuantity("0");
    } else {
      setSku("");
      setName("");
      setBaseUnit("Piece");
      setTrackingMode("Standard");
      setReorderThreshold("10");
      setInitialLocationId(locations[0]?.id || "");
      setInitialQuantity("0");
    }
    setError(null);
  }, [editingProduct, isOpen, locations]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEditing) {
        const res = await fetch(`/api/stock/products/${encodeURIComponent(sku)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            baseUnit,
            trackingMode,
            reorderThreshold: Number(reorderThreshold),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update product");
      } else {
        const res = await fetch("/api/stock/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: sku.trim().toUpperCase(),
            name: name.trim(),
            baseUnit,
            trackingMode,
            reorderThreshold: Number(reorderThreshold),
            initialLocationId: initialLocationId || undefined,
            initialQuantity: Number(initialQuantity) || 0,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create product");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-950">
                {isEditing ? `Edit Product: ${editingProduct?.sku}` : "Add Master Product"}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isEditing ? "Update SKU metadata & threshold" : "Register a new SKU into enterprise inventory"}
              </p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU / Barcode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                SKU / Barcode <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                disabled={isEditing}
                required
                placeholder="e.g. DRL-20V-BL"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-500 transition"
              />
            </div>

            {/* Base Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Base Unit <span className="text-rose-500">*</span>
              </label>
              <select
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value as BaseUnit)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              >
                <option value="Piece">Piece (pcs)</option>
                <option value="Kg">Kilogram (Kg)</option>
                <option value="Liter">Liter (L)</option>
                <option value="Meter">Meter (m)</option>
                <option value="Box">Box</option>
              </select>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. 20V Brushless Cordless Drill"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            />
          </div>

          {/* Tracking Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Tracking Mode
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(["Standard", "Batch / Expiry", "Serialized"] as TrackingMode[]).map((mode) => (
                <label
                  key={mode}
                  className={`border rounded-xl p-2.5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1 ${
                    trackingMode === mode
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="trackingMode"
                    value={mode}
                    checked={trackingMode === mode}
                    onChange={() => setTrackingMode(mode)}
                    className="sr-only"
                  />
                  <span className="text-xs font-semibold">{mode}</span>
                  <span className={`text-[10px] ${trackingMode === mode ? "text-slate-300" : "text-slate-400"}`}>
                    {mode === "Standard" ? "Qty counts" : mode === "Batch / Expiry" ? "Batches & lots" : "Unique S/N"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Reorder Threshold */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reorder Threshold (Minimum Alert Quantity)
            </label>
            <input
              type="number"
              min="0"
              value={reorderThreshold}
              onChange={(e) => setReorderThreshold(e.target.value)}
              placeholder="10"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Triggers a low-stock alert on the Dashboard when available stock reaches or falls below this number.
            </p>
          </div>

          {/* Initial stock (only for new products) */}
          {!isEditing && locations.length > 0 && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Initial Receiving Location
                </label>
                <select
                  value={initialLocationId}
                  onChange={(e) => setInitialLocationId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                >
                  <option value="">None (Zero Stock)</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Initial On Hand Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialQuantity}
                  onChange={(e) => setInitialQuantity(e.target.value)}
                  disabled={!initialLocationId}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-400 transition"
                />
              </div>
            </div>
          )}

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
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isEditing ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
