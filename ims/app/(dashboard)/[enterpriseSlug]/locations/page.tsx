"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WarehouseLocation } from "@/types/inventory";
import {
  MapPin,
  Plus,
  Trash2,
  Layers,
  FolderTree,
  Building2,
  Truck,
  AlertOctagon,
  Search,
  RefreshCw,
  Box,
} from "lucide-react";
import { LocationModal } from "@/components/workspace/location-modal";

export default function LocationsPage() {
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/stock/locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (e) {
      console.error("Failed to load locations", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete location "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/stock/locations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete location");
      await fetchLocations();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filtered = locations.filter((loc) => {
    const q = searchQuery.toLowerCase();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.code.toLowerCase().includes(q) ||
      loc.type.toLowerCase().includes(q)
    );
  });

  // Organize by root and child nodes for tree visualization
  const rootLocations = filtered.filter((l) => !l.parentId);
  const getChildren = (parentId: string) => filtered.filter((l) => l.parentId === parentId);

  const getLocationIcon = (type: string) => {
    switch (type) {
      case "Warehouse":
        return Building2;
      case "Vehicle":
        return Truck;
      case "Scrap Area":
      case "Quarantine Area":
        return AlertOctagon;
      case "Bin":
      case "Shelf":
        return Box;
      default:
        return MapPin;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-slate-900" />
            <span>Locations & Bins — Warehouse Map</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Physical layout, storage aisles, bins, vehicles, and logical inventory zones
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Location</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search locations by name, code (e.g. WH-MAIN, BAY-A), or type..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
          />
        </div>
      </div>

      {/* Warehouse Hierarchy Tree & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hierarchy Tree (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-950">Storage Hierarchy Tree</h2>
            </div>
            <span className="text-[11px] text-slate-400">{locations.length} total zones</span>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                Loading warehouse map...
              </div>
            ) : rootLocations.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No storage locations found.
              </div>
            ) : (
              <div className="space-y-4 font-sans">
                {rootLocations.map((root) => {
                  const RootIcon = getLocationIcon(root.type);
                  const children = getChildren(root.id);

                  return (
                    <div
                      key={root.id}
                      className="border border-slate-200/90 rounded-xl p-4 bg-slate-50/50 space-y-3"
                    >
                      {/* Root Item */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                            <RootIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-950">{root.name}</span>
                              <span className="font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                {root.code}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block">{root.type}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-xs font-bold font-mono text-slate-900 block">
                              {root.totalUnits.toLocaleString()} units
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {root.itemCount} distinct SKUs
                            </span>
                          </div>
                          <button
                            onClick={() => handleDelete(root.id, root.name)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 transition cursor-pointer"
                            title="Delete location"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Nested Children */}
                      {children.length > 0 && (
                        <div className="ml-5 pl-4 border-l-2 border-slate-200 space-y-2.5 pt-1">
                          {children.map((child) => {
                            const ChildIcon = getLocationIcon(child.type);
                            const grandChildren = getChildren(child.id);

                            return (
                              <div key={child.id} className="space-y-2">
                                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center">
                                      <ChildIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <span className="font-semibold text-xs text-slate-900 block">
                                        {child.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {child.code} • {child.type}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono font-semibold text-slate-800">
                                      {child.totalUnits} units
                                    </span>
                                    <button
                                      onClick={() => handleDelete(child.id, child.name)}
                                      className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Grandchildren (Bins / Shelves) */}
                                {grandChildren.length > 0 && (
                                  <div className="ml-4 pl-3 border-l border-slate-200 space-y-1.5">
                                    {grandChildren.map((grandChild) => (
                                      <div
                                        key={grandChild.id}
                                        className="p-2 rounded bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Box className="w-3 h-3 text-slate-400" />
                                          <span className="font-medium text-slate-900">
                                            {grandChild.name}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-mono">
                                            ({grandChild.code})
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-semibold text-slate-800">
                                            {grandChild.totalUnits} units
                                          </span>
                                          <button
                                            onClick={() => handleDelete(grandChild.id, grandChild.name)}
                                            className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Location Cards & Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-slate-700" />
              <span>Location Types Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Physical bins keep track of stock location to minimize pick and transit time.
            </p>

            <div className="space-y-2">
              {[
                { name: "Primary Warehouses", filter: "Warehouse" },
                { name: "Receiving Bays (Dock A)", filter: "Receiving Bay" },
                { name: "Storage Aisles & Racks", filter: "Aisle" },
                { name: "Shelves & Specific Bins", filter: "Shelf" },
                { name: "Vehicles / In-Transit", filter: "Vehicle" },
                { name: "Scrap & Quarantine", filter: "Scrap Area" },
              ].map((category) => {
                const count = locations.filter(
                  (l) => l.type === category.filter || (category.filter === "Shelf" && l.type === "Bin")
                ).length;

                return (
                  <div
                    key={category.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs"
                  >
                    <span className="text-slate-700 font-medium">{category.name}</span>
                    <span className="font-bold font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-900">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Location Modal */}
      <LocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchLocations}
        existingLocations={locations}
      />
    </div>
  );
}
