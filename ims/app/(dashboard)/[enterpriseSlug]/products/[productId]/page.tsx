"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useWorkspace } from "@/components/workspace/workspace-context";
import {
  ProductItem,
  StockLedgerRecord,
  WarehouseLocation,
} from "@/types/inventory";
import {
  Boxes,
  ArrowLeft,
  MapPin,
  Clock,
  PackagePlus,
  ArrowRightLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  Shield,
  Layers,
} from "lucide-react";
import {
  ReceiveStockModal,
  TransferStockModal,
} from "@/components/workspace/operation-modals";

interface ProductDetailPageProps {
  params: Promise<{ enterpriseSlug: string; productId: string }>;
}

export function ProductDetailClient({
  enterpriseSlug,
  productId,
}: {
  enterpriseSlug: string;
  productId: string;
}) {
  const decodedSku = decodeURIComponent(productId);

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [locationBreakdown, setLocationBreakdown] = useState<
    Array<{ locationId: string; locationName: string; quantity: number }>
  >([]);
  const [history, setHistory] = useState<StockLedgerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [prodDetailRes, allLocsRes] = await Promise.all([
        fetch(`/api/stock/products/${encodeURIComponent(decodedSku)}`),
        fetch("/api/stock/locations"),
      ]);

      if (prodDetailRes.ok) {
        const detail = await prodDetailRes.json();
        setProduct(detail.product);
        setLocationBreakdown(detail.locationBreakdown || []);
        setHistory(detail.history || []);
      }

      if (allLocsRes.ok) {
        const locs = await allLocsRes.json();
        setLocations(locs);
      }
    } catch (e) {
      console.error("Failed to load product details", e);
    } finally {
      setIsLoading(false);
    }
  }, [decodedSku]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-xs text-slate-500">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Loading product information...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-sm font-semibold text-slate-900">Product Not Found</p>
        <p className="text-xs text-slate-500 mt-1">
          SKU &quot;{decodedSku}&quot; does not exist in this enterprise.
        </p>
        <Link
          href={`/${enterpriseSlug}/products`}
          className="mt-4 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Product Catalog</span>
        </Link>
      </div>
    );
  }

  const isInStock = product.status === "In Stock";
  const isLowStock = product.status === "Low Stock";

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${enterpriseSlug}/products`}
          className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products Catalog</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReceiveOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Receive More</span>
          </button>
          <button
            onClick={() => setIsTransferOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Product Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-900 text-white font-bold">
                {product.sku}
              </span>
              <h1 className="text-xl font-bold text-slate-950">{product.name}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Tracking Mode: <span className="font-medium text-slate-800">{product.trackingMode}</span> • Base Unit:{" "}
              <span className="font-medium text-slate-800">{product.baseUnit}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isInStock && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>In Stock</span>
              </span>
            )}
            {isLowStock && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock</span>
              </span>
            )}
            {!isInStock && !isLowStock && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <XCircle className="w-3.5 h-3.5" />
                <span>Out of Stock</span>
              </span>
            )}
          </div>
        </div>

        {/* Stock Breakdown Metrics */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Physical On Hand
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900 block mt-1">
              {product.onHand.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">{product.baseUnit}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Reserved for Orders
            </span>
            <span className="text-2xl font-bold font-mono text-slate-600 block mt-1">
              {product.reserved.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">{product.baseUnit}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
              Available to Promise (ATP)
            </span>
            <span className="text-2xl font-bold font-mono text-white block mt-1">
              {product.availableStock.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">On Hand - Reserved</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Reorder Threshold
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900 block mt-1">
              {product.reorderThreshold.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400">Alert threshold</span>
          </div>
        </div>
      </div>

      {/* Grid: Location Breakdown & Movement History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Location Distribution */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-950">Stock By Location</h2>
            </div>
            <span className="text-[11px] text-slate-400">
              {locationBreakdown.length} active locations
            </span>
          </div>

          <div className="p-4">
            {locationBreakdown.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No location inventory balance recorded for this product yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {locationBreakdown.map((loc) => (
                  <div
                    key={loc.locationId}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-900 block">
                        {loc.locationName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ID: {loc.locationId}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {loc.quantity.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1">
                        {product.baseUnit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Movement Ledger History for this Product */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-950">Movement History</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {history.length} records
            </span>
          </div>

          <div className="p-4 max-h-[420px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No movements recorded for this product.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((log) => {
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
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50/60 border border-slate-200/70 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${badgeBg}`}
                        >
                          {log.action}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-700">
                          Qty:{" "}
                          <strong className="font-mono text-slate-900">
                            {log.quantity > 0 ? `+${log.quantity}` : log.quantity} {product.baseUnit}
                          </strong>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          By: <strong className="text-slate-800">{log.performedBy}</strong>
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/40">
                        <span>
                          {log.fromLocation} → {log.toLocation}
                        </span>
                        {log.reference && (
                          <span className="font-mono text-slate-400">Ref: {log.reference}</span>
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
        products={[product]}
        locations={locations}
        initialSku={product.sku}
      />

      <TransferStockModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onSuccess={fetchData}
        products={[product]}
        locations={locations}
        initialSku={product.sku}
      />
    </div>
  );
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = use(params);
  return (
    <ProductDetailClient
      enterpriseSlug={resolvedParams.enterpriseSlug}
      productId={resolvedParams.productId}
    />
  );
}
