"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/components/workspace/workspace-context";
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
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { LocationModal } from "@/components/workspace/location-modal";

export default function LocationsPage() {
  const { targetSlug, activeEnterprise, isManager, hasPermission } = useWorkspace();
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canAddLocation = isManager || hasPermission("locations:create");
  const canDeleteLocation = isManager || hasPermission("locations:delete");

  // In-App Location Deletion Modal State
  const [deletingLocation, setDeletingLocation] = useState<WarehouseLocation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [forceDelete, setForceDelete] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const headers: HeadersInit = activeEnterprise?.id
        ? { "x-enterprise-id": activeEnterprise.id }
        : {};

      const res = await fetch("/api/stock/locations", { headers });
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (e) {
      console.error("Failed to load locations", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeEnterprise?.id]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleConfirmDelete = async () => {
    if (!deletingLocation) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const headers: HeadersInit = activeEnterprise?.id
        ? { "x-enterprise-id": activeEnterprise.id }
        : {};

      const res = await fetch(
        `/api/stock/locations/${deletingLocation.id}?force=${forceDelete}`,
        {
          method: "DELETE",
          headers,
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete location");
      }

      setDeletingLocation(null);
      await fetchLocations();
    } catch (err: any) {
      setDeleteError(err.message || "An unexpected error occurred while deleting the location.");
    } finally {
      setIsDeleting(false);
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
    <div className="space-y-6 font-sans">
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

        {canAddLocation && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Location</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search locations by name, code, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 shadow-2xs"
          />
        </div>
      </div>

      {/* Main Hierarchy Tree View */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <FolderTree className="w-4 h-4 text-slate-500" />
            <span>Facility & Storage Layout</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {locations.length} total zones
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
            <span>Loading storage zones...</span>
          </div>
        ) : rootLocations.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <Layers className="w-8 h-8 stroke-1 opacity-50" />
            <span className="font-semibold text-slate-700">No locations configured</span>
            <span className="text-[11px] text-slate-400">
              Create your primary warehouse or stockroom to begin tracking balances.
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {rootLocations.map((root) => {
              const RootIcon = getLocationIcon(root.type);
              const children = getChildren(root.id);

              return (
                <div
                  key={root.id}
                  className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3 transition hover:border-slate-300"
                >
                  {/* Root Node Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                        <RootIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-950">
                            {root.name}
                          </span>
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
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
                      {canDeleteLocation && (
                        <button
                          onClick={() => {
                            setDeletingLocation(root);
                            setDeleteError(null);
                            setForceDelete(false);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1.5 transition cursor-pointer"
                          title="Delete location"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
                                {canDeleteLocation && (
                                  <button
                                    onClick={() => {
                                      setDeletingLocation(child);
                                      setDeleteError(null);
                                      setForceDelete(false);
                                    }}
                                    className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                                    title="Delete sub-location"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
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
                                      {canDeleteLocation && (
                                        <button
                                          onClick={() => {
                                            setDeletingLocation(grandChild);
                                            setDeleteError(null);
                                            setForceDelete(false);
                                          }}
                                          className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                          title="Delete bin/shelf"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
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

      {/* In-App Delete Location Confirmation Modal */}
      {deletingLocation && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950">Delete Storage Location</h3>
                <p className="text-xs text-slate-500">
                  Confirm removal from enterprise layout
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-950 font-semibold">{deletingLocation.name}</strong>?
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-slate-700">
                  <span>Location Code:</span>
                  <span className="font-bold text-slate-900">{deletingLocation.code}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Type:</span>
                  <span>{deletingLocation.type}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Stored Units:</span>
                  <span className={deletingLocation.totalUnits > 0 ? "font-bold text-rose-600" : "text-slate-900"}>
                    {deletingLocation.totalUnits} units
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Distinct SKUs:</span>
                  <span>{deletingLocation.itemCount} items</span>
                </div>
              </div>

              {deletingLocation.totalUnits > 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      <strong>Warning:</strong> This location currently holds <strong>{deletingLocation.totalUnits}</strong> active stock units. Deleting will adjust on-hand inventory balances.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 pt-1 border-t border-amber-200/70 text-[11px] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forceDelete}
                      onChange={(e) => setForceDelete(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-0"
                    />
                    <span>Force delete and write off remaining stock</span>
                  </label>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  This location is empty. Any nested sub-locations will be decoupled and promoted to root level.
                </p>
              )}
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
                  setDeletingLocation(null);
                  setDeleteError(null);
                  setForceDelete(false);
                }}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || (deletingLocation.totalUnits > 0 && !forceDelete)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-40"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Location</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Create Modal */}
      <LocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchLocations}
        existingLocations={locations}
      />
    </div>
  );
}
