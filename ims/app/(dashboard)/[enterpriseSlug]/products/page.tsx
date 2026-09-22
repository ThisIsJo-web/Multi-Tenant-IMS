"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWorkspace } from "@/components/workspace/workspace-context";
import {
  ProductItem,
  ProductStatus,
  TrackingMode,
  WarehouseLocation,
} from "@/types/inventory";
import {
  Boxes,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
} from "lucide-react";
import { ProductModal } from "@/components/workspace/product-modal";

export default function ProductsCatalogPage() {
  const { targetSlug, activeEnterprise } = useWorkspace();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [trackingFilter, setTrackingFilter] = useState<string>("ALL");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // In-App Deletion Modal State
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    try {
      const headers: HeadersInit = activeEnterprise?.id
        ? { "x-enterprise-id": activeEnterprise.id }
        : {};

      const [prodRes, locRes] = await Promise.all([
        fetch("/api/stock/products", { headers }),
        fetch("/api/stock/locations", { headers }),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
      if (locRes.ok) {
        const locData = await locRes.json();
        setLocations(locData);
      }
    } catch (e) {
      console.error("Failed to fetch product catalog", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeEnterprise?.id]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const headers: HeadersInit = activeEnterprise?.id
        ? { "x-enterprise-id": activeEnterprise.id }
        : {};

      const res = await fetch(
        `/api/stock/products/${encodeURIComponent(deletingProduct.sku)}`,
        {
          method: "DELETE",
          headers,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete product");
      }

      setDeletingProduct(null);
      await fetchCatalog();
    } catch (err: any) {
      setDeleteError(err.message || "An unexpected error occurred while deleting the product.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesTracking =
      trackingFilter === "ALL" || p.trackingMode === trackingFilter;
    return matchesSearch && matchesStatus && matchesTracking;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2">
            <span>Product Catalog</span>
            <span className="text-xs font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {products.length} SKUs
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-location inventory, stock threshold tracking, and catalog controls.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SKU or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-2xs"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-[11px] font-medium">Tracking:</span>
            <select
              value={trackingFilter}
              onChange={(e) => setTrackingFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">All Tracking</option>
              <option value="Standard">Standard</option>
              <option value="Lot-Tracked">Lot-Tracked</option>
              <option value="Serialized">Serialized</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-600 font-semibold tracking-wider uppercase text-[10px]">
                <th className="px-5 py-3.5">Product / SKU</th>
                <th className="px-4 py-3.5">Unit</th>
                <th className="px-4 py-3.5">Tracking</th>
                <th className="px-4 py-3.5 text-right">On Hand</th>
                <th className="px-4 py-3.5 text-right">Reserved</th>
                <th className="px-4 py-3.5 text-right">Available (ATP)</th>
                <th className="px-4 py-3.5">Stock Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    <span>Loading products catalog...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Package className="w-7 h-7 stroke-1 opacity-50 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">No products found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery
                        ? "Try refining your search terms or filters"
                        : "Click 'New Product' above to create your first catalog item"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isInStock = product.status === "In Stock";
                  const isLowStock = product.status === "Low Stock";

                  return (
                    <tr
                      key={product.sku}
                      className="hover:bg-slate-50/75 transition-colors group"
                    >
                      {/* Name & SKU */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                            <Boxes className="w-4 h-4" />
                          </div>
                          <div>
                            <Link
                              href={`/${targetSlug}/products/${encodeURIComponent(product.sku)}`}
                              className="font-semibold text-slate-900 hover:underline block leading-tight"
                            >
                              {product.name}
                            </Link>
                            <span className="font-mono text-[11px] text-slate-500">
                              {product.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-mono">
                          {product.baseUnit}
                        </span>
                      </td>

                      {/* Tracking Mode */}
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap text-[11px]">
                        {product.trackingMode}
                      </td>

                      {/* On Hand */}
                      <td className="px-4 py-4 text-right font-mono font-medium text-slate-900 whitespace-nowrap">
                        {product.onHand.toLocaleString()}
                      </td>

                      {/* Reserved */}
                      <td className="px-4 py-4 text-right font-mono text-slate-500 whitespace-nowrap">
                        {product.reserved.toLocaleString()}
                      </td>

                      {/* Available ATP */}
                      <td className="px-4 py-4 text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                        {product.availableStock.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isInStock && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            <CheckCircle2 className="w-3 h-3 text-slate-700" />
                            <span>In Stock</span>
                          </span>
                        )}
                        {isLowStock && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            <span>Low Stock</span>
                          </span>
                        )}
                        {!isInStock && !isLowStock && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Out of Stock</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/${targetSlug}/products/${encodeURIComponent(product.sku)}`}
                            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                            title="View Stock Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingProduct(product);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-App Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">Delete Product</h3>
                <p className="text-xs text-slate-500">
                  Confirm permanent removal from inventory
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-950 font-semibold">{deletingProduct.name}</strong>?
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-700">
                  <span>SKU:</span>
                  <span className="font-bold text-slate-900">{deletingProduct.sku}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Tracking Mode:</span>
                  <span>{deletingProduct.trackingMode}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>On Hand:</span>
                  <span>{deletingProduct.onHand} {deletingProduct.baseUnit}s</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Available (ATP):</span>
                  <span className="font-semibold text-slate-900">{deletingProduct.availableStock} {deletingProduct.baseUnit}s</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                All associated warehouse location balances for this product will be permanently deleted. Historical stock ledger transactions will remain preserved.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeletingProduct(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchCatalog}
        editingProduct={editingProduct}
        locations={locations}
      />
    </div>
  );
}
