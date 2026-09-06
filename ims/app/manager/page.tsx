"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/navbar/top-nav";
import {
  Building2,
  Plus,
  Users,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  UserCheck,
  Sliders,
} from "lucide-react";

export default function ManagerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeEnterprise, setActiveEnterprise] = useState<any>(null);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Modals
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);

  // Form states
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState<"staff" | "manager">("staff");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["stock:view"]);
  const [editPermissionsList, setEditPermissionsList] = useState<string[]>([]);
  const [pendingPermissionsMap, setPendingPermissionsMap] = useState<Record<string, string[]>>({});

  // Key operations
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRotatingKey, setIsRotatingKey] = useState(false);

  const availablePermissions = [
    { id: "stock:view", label: "View Stock" },
    { id: "stock:receive", label: "Receive Stock" },
    { id: "stock:transfer", label: "Transfer Stock" },
    { id: "stock:adjust", label: "Adjust Stock" },
    { id: "stock:audit", label: "Audit Stock" },
    { id: "enterprise:manage", label: "Enterprise Management" },
  ];

  const fetchContext = async () => {
    try {
      const res = await fetch("/api/enterprise/context");
      if (!res.ok) throw new Error("Unauthorized");
      const data = await res.json();

      if (data.user.role !== "manager" && data.user.role !== "superadmin") {
        router.push("/apply-manager");
        return;
      }

      setUser(data.user);
      setActiveEnterprise(data.activeEnterprise);
      setEnterprises(data.enterprises || []);

      if (data.activeEnterprise) {
        loadStaff(data.activeEnterprise.id);
        loadPendingRequests(data.activeEnterprise.id);
      }
    } catch {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaff = async (enterpriseId: string) => {
    setIsLoadingStaff(true);
    try {
      const res = await fetch(`/api/manager/enterprises/${enterpriseId}/staff`);
      if (res.ok) {
        setStaffList(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const loadPendingRequests = async (enterpriseId: string) => {
    setIsLoadingRequests(true);
    try {
      const res = await fetch(`/api/manager/enterprises/${enterpriseId}/join-requests`);
      if (res.ok) {
        const requests = await res.json();
        setPendingRequests(requests);
        // Initialize permission mappings for pending requests
        const map: Record<string, string[]> = {};
        requests.forEach((r: any) => {
          map[r.id] = r.permissions && r.permissions.length > 0 ? r.permissions : ["stock:view"];
        });
        setPendingPermissionsMap(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, []);

  const handleSwitchEnterprise = async (enterpriseId: string) => {
    try {
      const res = await fetch("/api/enterprise/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseId }),
      });
      if (res.ok) {
        await fetchContext();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create new Enterprise
  const handleAddEnterprise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    try {
      const res = await fetch("/api/enterprise/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim(), slug: orgSlug.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create enterprise");

      setShowAddOrgModal(false);
      setOrgName("");
      setOrgSlug("");
      alert(`Enterprise "${data.enterprise.name}" registered with key: ${data.enterprise.enterpriseKey}`);
      await fetchContext();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Add staff member directly by email
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnterprise || !staffEmail.trim()) return;

    try {
      const res = await fetch(`/api/manager/enterprises/${activeEnterprise.id}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: staffEmail.trim(),
          role: staffRole,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add staff member");

      setShowAddStaffModal(false);
      setStaffEmail("");
      setSelectedPermissions(["stock:view"]);
      alert(data.message);
      loadStaff(activeEnterprise.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Approve Pending Join Request with custom permissions
  const handleApproveRequest = async (requestId: string) => {
    const permissions = pendingPermissionsMap[requestId] || ["stock:view"];
    try {
      const res = await fetch(`/api/manager/join-requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve request");

      alert(data.message);
      if (activeEnterprise) {
        loadPendingRequests(activeEnterprise.id);
        loadStaff(activeEnterprise.id);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Reject Pending Join Request
  const handleRejectRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to reject this join request?")) return;

    try {
      const res = await fetch(`/api/manager/join-requests/${requestId}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject request");

      alert(data.message);
      if (activeEnterprise) {
        loadPendingRequests(activeEnterprise.id);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Toggle permission for a pending request
  const togglePendingPermission = (requestId: string, permId: string) => {
    setPendingPermissionsMap((prev) => {
      const current = prev[requestId] || ["stock:view"];
      const updated = current.includes(permId)
        ? current.filter((p) => p !== permId)
        : [...current, permId];
      return { ...prev, [requestId]: updated };
    });
  };

  // Open Edit Permissions Modal for an existing staff member
  const handleOpenEditPermissions = (staff: any) => {
    setEditingStaff(staff);
    setEditPermissionsList([...staff.permissions]);
  };

  const toggleEditPermission = (permId: string) => {
    setEditPermissionsList((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // Save edited permissions for active staff member
  const handleSaveEditedPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnterprise || !editingStaff) return;

    try {
      const res = await fetch(
        `/api/manager/enterprises/${activeEnterprise.id}/staff/${editingStaff.id}/permissions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: editPermissionsList }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update permissions");

      setEditingStaff(null);
      alert(data.message);
      loadStaff(activeEnterprise.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Remove staff member from enterprise
  const handleRemoveStaff = async (staffId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this enterprise?`)) return;

    try {
      const res = await fetch(
        `/api/manager/enterprises/${activeEnterprise.id}/staff/${staffId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to remove staff member");

      alert(data.message);
      loadStaff(activeEnterprise.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Key rotation
  const handleRotateKey = async () => {
    if (!activeEnterprise) return;
    if (!confirm(`Are you sure you want to regenerate the Enterprise Key for ${activeEnterprise.name}?`)) return;

    setIsRotatingKey(true);
    try {
      const res = await fetch("/api/enterprise/rotate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterpriseId: activeEnterprise.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setActiveEnterprise((prev: any) => ({ ...prev, enterpriseKey: data.enterprise.enterpriseKey }));
      alert(`New Enterprise Key: ${data.enterprise.enterpriseKey}`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRotatingKey(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center text-slate-500 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Loading manager portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-slate-200">
      <TopNav
        user={user}
        activeEnterprise={activeEnterprise}
        enterprises={enterprises}
        onSwitchEnterprise={handleSwitchEnterprise}
      />

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Manager Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold uppercase tracking-wider">
                Manager Portal
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-950 mt-1">
              Enterprise Administration & Staff Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review pending key requests, assign operational permissions, and manage staff members.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddOrgModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Enterprise</span>
            </button>
          </div>
        </div>

        {/* Enterprise Key Card & Controls */}
        {activeEnterprise && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-500">Managing Organization:</span>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{activeEnterprise.name}</span>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    /{activeEnterprise.slug}
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Staff Member</span>
                </button>
              </div>
            </div>

            {/* Key display banner */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-slate-700 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">
                    Enterprise Key (Distribute to authorized members)
                  </span>
                  <div className="font-mono text-xs text-slate-900 flex items-center gap-2 mt-0.5">
                    <span>{showKey ? activeEnterprise.enterpriseKey : "ENT-••••-••••-••••"}</span>
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(activeEnterprise.enterpriseKey)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 hover:bg-slate-100 transition cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                </button>

                <button
                  onClick={handleRotateKey}
                  disabled={isRotatingKey}
                  className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRotatingKey ? "animate-spin" : ""}`} />
                  <span>Rotate Key</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: Pending Join Requests (Key Entries) */}
        {activeEnterprise && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Pending Enterprise Join Requests</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      {pendingRequests.length} Pending
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Users who entered this Enterprise Key. Assign dynamic permissions before approving.
                  </p>
                </div>
              </div>

              <button
                onClick={() => activeEnterprise && loadPendingRequests(activeEnterprise.id)}
                disabled={isLoadingRequests}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRequests ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-slate-400 text-xs">
                No pending join requests for {activeEnterprise.name}. When a user enters the Enterprise Key, their request will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/30 flex flex-col md:flex-row md:items-start justify-between gap-4"
                  >
                    <div className="space-y-2 max-w-md">
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{req.name}</div>
                        <div className="text-xs text-slate-500">{req.email}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Requested on: {new Date(req.requestedAt).toLocaleString()}
                        </div>
                      </div>

                      {/* Permissions Selection Checklist */}
                      <div>
                        <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Apply Operational Permissions:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 bg-white p-2.5 rounded-lg border border-slate-200">
                          {availablePermissions.map((perm) => {
                            const isChecked = (
                              pendingPermissionsMap[req.id] || ["stock:view"]
                            ).includes(perm.id);
                            return (
                              <label
                                key={perm.id}
                                className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePendingPermission(req.id, perm.id)}
                                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                />
                                <span>{perm.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Approve / Reject Action Buttons */}
                    <div className="flex items-center gap-2 self-end md:self-start pt-2 md:pt-0">
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Approve & Grant Permissions</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: Active Staff Members */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-700" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Staff Members in {activeEnterprise?.name || "Enterprise"}
                </h3>
                <p className="text-xs text-slate-500">
                  Manage active members and edit their assigned operational permissions.
                </p>
              </div>
            </div>

            <button
              onClick={() => activeEnterprise && loadStaff(activeEnterprise.id)}
              disabled={isLoadingStaff}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStaff ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">Enterprise Role</th>
                  <th className="p-3">Scoped Permissions</th>
                  <th className="p-3">Joined Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No active staff members. When pending join requests are approved, staff will appear here.
                    </td>
                  </tr>
                ) : (
                  staffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{staff.name}</div>
                        <div className="text-[11px] text-slate-500">{staff.email}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            staff.role === "manager"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {staff.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {staff.permissions.map((p: string) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px]"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(staff.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditPermissions(staff)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition"
                            title="Edit Permissions"
                          >
                            <Sliders className="w-3 h-3 text-slate-600" />
                            <span>Edit Permissions</span>
                          </button>

                          {staff.role !== "manager" && (
                            <button
                              onClick={() => handleRemoveStaff(staff.id, staff.name)}
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer transition"
                              title="Remove Staff"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal: Add Enterprise */}
      {showAddOrgModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Add New Enterprise</h3>
            <p className="text-xs text-slate-500 mt-1">
              You will become the Manager of this enterprise. A secure Enterprise Key will be generated automatically.
            </p>

            <form onSubmit={handleAddEnterprise} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Enterprise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Cargo & Freight"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Slug (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. apex-cargo"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOrgModal(false)}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Create Enterprise
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Staff Member Directly */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Add Staff Member</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add an existing registered user to {activeEnterprise?.name} by their work email.
            </p>

            <form onSubmit={handleAddStaff} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">User Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Role</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Co-Manager</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Dynamic Scoped Permissions
                </label>
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {availablePermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>{perm.label}</span>
                      <span className="text-[10px] font-mono text-slate-400">({perm.id})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Permissions for Active Staff Member */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-700" />
              <span>Edit Staff Permissions</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Modify operational permissions for <strong className="text-slate-800">{editingStaff.name}</strong> ({editingStaff.email}).
            </p>

            <form onSubmit={handleSaveEditedPermissions} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Dynamic Scoped Permissions
                </label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {availablePermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={editPermissionsList.includes(perm.id)}
                        onChange={() => toggleEditPermission(perm.id)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span className="font-medium">{perm.label}</span>
                      <span className="text-[10px] font-mono text-slate-400">({perm.id})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Save Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
