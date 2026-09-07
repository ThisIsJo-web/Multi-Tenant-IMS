"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "./workspace-context";
import {
  X,
  Building2,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export function EditWorkspaceModal() {
  const router = useRouter();
  const {
    activeEnterprise,
    canEditWorkspace,
    isEditModalOpen,
    closeEditModal,
    refreshContext,
  } = useWorkspace();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessScale, setBusinessScale] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");

  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeEnterprise) {
      setName(activeEnterprise.name || "");
      setSlug(activeEnterprise.slug || "");
      setLogo(activeEnterprise.logo || "");
      const meta = activeEnterprise.metadata || {};
      setIndustry(meta.industry || "General Inventory & Logistics");
      setBusinessScale(meta.businessScale || "Medium (20-100 staff)");
      setDescription(meta.description || "");
      setCurrency(meta.currency || "USD");
    }
  }, [activeEnterprise, isEditModalOpen]);

  if (!isEditModalOpen || !activeEnterprise) return null;

  if (!canEditWorkspace) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Manager Access Required</h3>
          <p className="text-xs text-slate-500 mt-2">
            Only users with a Managerial Role can edit enterprise workspace settings.
          </p>
          <button
            onClick={closeEditModal}
            className="mt-5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRotateKey = async () => {
    if (
      !confirm(
        `Are you sure you want to regenerate the Enterprise Key for ${activeEnterprise.name}? The previous key will stop working immediately.`
      )
    ) {
      return;
    }

    setIsRotating(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/enterprise/rotate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseId: activeEnterprise.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to rotate key");

      await refreshContext();
      setSuccessMessage(`Enterprise Key rotated: ${data.enterprise.enterpriseKey}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsRotating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/enterprise/${activeEnterprise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          logo: logo.trim() || null,
          metadata: {
            industry: industry.trim(),
            businessScale,
            description: description.trim(),
            currency,
            lastEditedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update workspace");

      setSuccessMessage("Workspace settings updated successfully!");
      await refreshContext();

      // If the slug changed, navigate to the new workspace URL
      if (data.enterprise?.slug && data.enterprise.slug !== activeEnterprise.slug) {
        setTimeout(() => {
          closeEditModal();
          router.push(`/${data.enterprise.slug}`);
        }, 1000);
      } else {
        setTimeout(() => {
          closeEditModal();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-950">Edit Enterprise Workspace</h2>
              <p className="text-[11px] text-slate-500">
                Manage organization profile, URL slug, and access credentials
              </p>
            </div>
          </div>
          <button
            onClick={closeEditModal}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enterprise Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Apex Supplies Inc."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Workspace URL Slug <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs text-slate-500 font-mono">
                  /
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  placeholder="apex-supplies"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-r-xl text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Industry */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Industry & Domain
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Building Materials, Tools"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              />
            </div>

            {/* Business Scale */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Operation Scale
              </label>
              <select
                value={businessScale}
                onChange={(e) => setBusinessScale(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
              >
                <option value="Small (1-20 staff)">Small (1-20 staff)</option>
                <option value="Medium (20-100 staff)">Medium (20-100 staff)</option>
                <option value="Enterprise (100+ staff)">Enterprise (100+ staff)</option>
                <option value="Multi-Warehouse Logistics">Multi-Warehouse Logistics</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Workspace Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Regional distribution hub and primary inventory operations..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
            />
          </div>

          {/* Enterprise Access Key Section */}
          <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-700" />
                Enterprise Access Key
              </span>
              <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                Shared with authorized staff
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-xs tracking-wider bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 flex items-center justify-between select-all">
                <span>
                  {showKey
                    ? activeEnterprise.enterpriseKey || "Restricted to Managers"
                    : activeEnterprise.enterpriseKey
                    ? "ENT-••••-••••-••••"
                    : "Restricted to Managers"}
                </span>
                {activeEnterprise.enterpriseKey && (
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {activeEnterprise.enterpriseKey && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeEnterprise.enterpriseKey!)}
                  className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
              <span>Invalidate previous key:</span>
              <button
                type="button"
                onClick={handleRotateKey}
                disabled={isRotating}
                className="text-xs text-rose-700 hover:text-rose-800 font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
                <span>Rotate Key</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={closeEditModal}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
