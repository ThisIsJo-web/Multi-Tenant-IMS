"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWorkspace } from "@/components/workspace/workspace-context";
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Briefcase,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Edit3,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  MANAGER_ASSIGNABLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  PermissionCode,
} from "@/types/permissions";

export default function TeamSettingsPage() {
  const { activeEnterprise, isManager, isSuperAdmin, isLoading: isWorkspaceLoading } = useWorkspace();

  const [staff, setStaff] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Permission Editor Modal
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchTeamData = useCallback(async () => {
    if (!activeEnterprise) return;
    try {
      if (isManager || isSuperAdmin) {
        const [staffRes, reqRes] = await Promise.all([
          fetch(`/api/manager/enterprises/${activeEnterprise.id}/staff`),
          fetch(`/api/manager/enterprises/${activeEnterprise.id}/join-requests`),
        ]);

        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaff(staffData);
        }
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setJoinRequests(reqData);
        }
      }
    } catch (e) {
      console.error("Failed to load team data", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeEnterprise, isManager, isSuperAdmin]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/manager/join-requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissions: ["stock:view", "locations:view", "products:view", "stock:receive", "stock:transfer"],
        }),
      });
      if (res.ok) {
        await fetchTeamData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/manager/join-requests/${requestId}/reject`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchTeamData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const openPermissionEditor = (member: any) => {
    setEditingMember(member);
    setSelectedPermissions(Array.isArray(member.permissions) ? [...member.permissions] : []);
    setModalError(null);
  };

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  const handleSavePermissions = async () => {
    if (!editingMember || !activeEnterprise) return;
    setIsSavingPermissions(true);
    setModalError(null);

    try {
      const res = await fetch(
        `/api/manager/enterprises/${activeEnterprise.id}/staff/${editingMember.id}/permissions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: selectedPermissions }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update permissions");

      setEditingMember(null);
      await fetchTeamData();
    } catch (err: any) {
      setModalError(err.message || "Failed to save permissions");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // ─── Non-Manager Guard ──────────────────────────────────────────────────
  if (!isWorkspaceLoading && !isManager && !isSuperAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-lg mx-auto my-12 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">Access Restricted</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          You do not have Manager privileges for this enterprise workspace. Only enterprise managers or platform administrators can view team members and manage access permissions.
        </p>
        <Link
          href={`/${activeEnterprise?.slug || ""}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const availableCategories = PERMISSION_CATEGORIES.filter((c) => c.id !== "system");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
            <Users className="w-5 h-5 text-slate-900" />
            <span>Team & Role Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise staff members, operational permissions, and pending access requests
          </p>
        </div>

        {isManager && (
          <Link
            href="/manager"
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition self-start sm:self-auto cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            <span>Full Manager Portal</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        )}
      </div>

      {/* Pending Join Requests (Managers only) */}
      {(isManager || isSuperAdmin) && joinRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200/90 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-950">Pending Key Join Requests</h2>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              {joinRequests.length} pending review
            </span>
          </div>

          <div className="p-4 divide-y divide-slate-100">
            {joinRequests.map((req) => (
              <div key={req.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{req.name || req.email}</span>
                  <span className="text-[11px] text-slate-500">{req.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoading === req.id}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={actionLoading === req.id}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff & Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-950">Enterprise Members</h2>
          <span className="text-[11px] text-slate-400">
            {staff.length > 0 ? `${staff.length} registered members` : "Workspace Roster"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-4 py-3.5">Scoped Role</th>
                <th className="px-6 py-3.5">Assigned Inventory Permissions</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Loading members...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No staff members loaded.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">{member.name}</span>
                      <span className="text-[11px] text-slate-400">{member.email}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          member.role === "manager"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.role === "manager" ? (
                        <span className="text-[11px] text-blue-700 font-medium bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          Manager Full Access
                        </span>
                      ) : member.permissions && member.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xl">
                          {member.permissions.map((p: string) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-mono font-medium"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          No specific permissions assigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {member.role !== "manager" && (
                        <button
                          type="button"
                          onClick={() => openPermissionEditor(member)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit Permissions</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Granular Permission Editor Modal                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Staff Permissions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingMember.name} · <span className="font-mono">{editingMember.email}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Error */}
            {modalError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Permissions Checkbox Matrix */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  Select the granular capabilities granted to this member for <strong>{activeEnterprise?.name}</strong>. Granted permissions apply immediately to warehouse locations, products, inventory movements, and cashier terminals.
                </div>
              </div>

              {availableCategories.map((cat) => {
                const catPerms = MANAGER_ASSIGNABLE_PERMISSIONS.filter((p) => p.category === cat.id);
                if (catPerms.length === 0) return null;

                return (
                  <div key={cat.id} className="space-y-2">
                    <div className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      {cat.name}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {catPerms.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.code);
                        return (
                          <label
                            key={perm.code}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border transition cursor-pointer select-none ${
                              isChecked
                                ? "bg-slate-900/5 border-slate-900 text-slate-950 font-medium"
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(perm.code)}
                              className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 text-xs flex items-center justify-between">
                                <span>{perm.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                                {perm.description}
                              </div>
                              <span className="font-mono text-[9px] text-slate-400 mt-1 block">
                                {perm.code}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                {selectedPermissions.length} permissions selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={isSavingPermissions}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  {isSavingPermissions ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Permissions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
