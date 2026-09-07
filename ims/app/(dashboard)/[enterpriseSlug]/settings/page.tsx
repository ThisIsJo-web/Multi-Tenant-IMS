"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/workspace/workspace-context";
import {
  Settings,
  Building2,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Save,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const {
    activeEnterprise,
    activeMembership,
    canEditWorkspace,
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
  }, [activeEnterprise]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRotateKey = async () => {
    if (!canEditWorkspace || !activeEnterprise) return;
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
    if (!canEditWorkspace || !activeEnterprise) return;

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

      if (data.enterprise?.slug && data.enterprise.slug !== activeEnterprise.slug) {
        setTimeout(() => {
          router.push(`/${data.enterprise.slug}/settings`);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-slate-900" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure enterprise branding, URL slug, and managerial access controls
        </p>
      </div>

      {/* Role Notice */}
      {!canEditWorkspace ? (
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-slate-500 shrink-0" />
          <div>
            <span className="text-xs font-bold block text-slate-900">Read-Only Workspace View</span>
            <span className="text-[11px] text-slate-500">
              You are signed in with a Staff role. Only users with a Managerial role can edit enterprise workspace settings.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-950 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <span className="text-xs font-bold block">Managerial Editing Privileges Active</span>
            <span className="text-[11px] text-blue-800/80">
              You have manager authority to update workspace metadata, adjust slug routing, and rotate keys.
            </span>
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Enterprise Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enterprise Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEditWorkspace}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500 transition"
              />
            </div>

            {/* URL Slug */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Workspace URL Slug
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs text-slate-500 font-mono">
                  /
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={!canEditWorkspace}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-r-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Industry */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Industry & Domain
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={!canEditWorkspace}
                placeholder="e.g. Building Materials, Heavy Equipment"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500 transition"
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
                disabled={!canEditWorkspace}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500 transition"
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
              disabled={!canEditWorkspace}
              rows={3}
              placeholder="Primary commercial warehouse and distribution center..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-500 transition"
            />
          </div>

          {/* Enterprise Access Key Management */}
          <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-slate-700" />
                Enterprise Access Key
              </span>
              <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                ENT-XXXX-XXXX-XXXX
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Users with this key can join this enterprise and request staff permissions.
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-xs tracking-wider bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 flex items-center justify-between select-all">
                <span>
                  {showKey
                    ? activeEnterprise?.enterpriseKey || "Restricted to Managers"
                    : activeEnterprise?.enterpriseKey
                    ? "ENT-••••-••••-••••"
                    : "Restricted to Managers"}
                </span>
                {activeEnterprise?.enterpriseKey && (
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {activeEnterprise?.enterpriseKey && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeEnterprise.enterpriseKey!)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>

            {canEditWorkspace && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 text-xs text-slate-500">
                <span>Regenerate if key has been compromised:</span>
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
            )}
          </div>

          {/* Submit */}
          {canEditWorkspace && (
            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaving ? "Saving..." : "Save Workspace Changes"}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
