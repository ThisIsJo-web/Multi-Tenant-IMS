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
} from "lucide-react";
import { ProductModal } from "@/components/workspace/product-modal";

export default function ProductsCatalogPage() {
  const { targetSlug } = useWorkspace();
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

  const fetchCatalog = useCallback(async () => {
    try {
      const [prodRes, locRes] = await Promise.all([
        fetch("/api/stock/products"),
        fetch("/api/stock/locations"),
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
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleDelete = async (sku: string) => {
    if (!confirm(`Are you sure you want to remove product ${sku} from catalog?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/stock/products/${encodeURIComponent(sku)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchCatalog();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete product");
      }
    } catch (e: any) {
      alert(e.message);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
            <Boxes className="w-5 h-5 text-slate-900" />
            <span>Products & Master Catalog</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage inventory SKUs, base units, tracking modes, and Available-to-Promise (ATP)
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, barcode, or product name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          {/* Tracking Mode Filter */}
          <select
            value={trackingFilter}
            onChange={(e) => setTrackingFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
          >
            <option value="ALL">All Tracking Modes</option>
            <option value="Standard">Standard</option>
            <option value="Batch / Expiry">Batch / Expiry</option>
            <option value="Serialized">Serialized</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">SKU / Barcode</th>
                <th className="px-5 py-3.5">Product Name</th>
                <th className="px-4 py-3.5">Base Unit</th>
                <th className="px-4 py-3.5">Tracking</th>
                <th className="px-4 py-3.5 text-right">On Hand</th>
                <th className="px-4 py-3.5 text-right">Reserved</th>
                <th className="px-4 py-3.5 text-right">Available (ATP)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Loading product catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No products match your criteria. Click &quot;Add Product&quot; to register one.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isInStock = product.status === "In Stock";
                  const isLowStock = product.status === "Low Stock";

                  return (
                    <tr key={product.sku} className="hover:bg-slate-50/70 transition">
                      {/* SKU */}
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <Link
                          href={`/${targetSlug}/products/${encodeURIComponent(product.sku)}`}
                          className="hover:underline hover:text-blue-600"
                        >
                          {product.sku}
                        </Link>
                      </td>

                      {/* Name */}
                      <td className="px-5 py-4 font-medium text-slate-900">
                        <Link
                          href={`/${targetSlug}/products/${encodeURIComponent(product.sku)}`}
                          className="hover:text-blue-600 transition"
                        >
                          {product.name}
                        </Link>
                      </td>

                      {/* Base Unit */}
                      <td className="px-4 py-4 whitespace-nowrap text-slate-500">
                        {product.baseUnit}
                      </td>

                      {/* Tracking */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {product.trackingMode}
                        </span>
                      </td>

                      {/* On Hand */}
                      <td className="px-4 py-4 text-right font-mono text-slate-900 whitespace-nowrap">
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>In Stock</span>
                          </span>
                        )}
                        {isLowStock && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        )}
                        {!isInStock && !isLowStock && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" />
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
                            title="View Locations & History"
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
                            onClick={() => handleDelete(product.sku)}
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
