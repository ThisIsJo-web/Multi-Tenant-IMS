"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/navbar/top-nav";
import {
  Shield,
  FileCheck,
  Users,
  Building2,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
} from "lucide-react";

type SuperAdminTab = "applications" | "users" | "enterprises";

export default function SuperAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeEnterprise, setActiveEnterprise] = useState<any>(null);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<SuperAdminTab>("applications");

  // Data states
  const [applications, setApplications] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [enterprisesList, setEnterprisesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reject modal
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const ctxRes = await fetch("/api/enterprise/context");
      if (!ctxRes.ok) {
        router.push("/login");
        return;
      }
      const ctx = await ctxRes.json();

      if (ctx.user.role !== "superadmin") {
        router.push("/workspace");
        return;
      }

      setCurrentUser(ctx.user);
      setActiveEnterprise(ctx.activeEnterprise);
      setEnterprises(ctx.enterprises || []);

      const [appsRes, usersRes, orgsRes] = await Promise.all([
        fetch("/api/manager-applications"),
        fetch("/api/admin/users"),
        fetch("/api/admin/enterprises"),
      ]);

      if (appsRes.ok) setApplications(await appsRes.json());
      if (usersRes.ok) setUsersList(await usersRes.json());
      if (orgsRes.ok) setEnterprisesList(await orgsRes.json());
    } catch (err) {
      console.error("Failed to load superadmin console data:", err);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Review Application (Approve / Reject)
  const handleReviewApplication = async (
    applicationId: string,
    status: "approved" | "rejected",
    notes?: string
  ) => {
    try {
      const res = await fetch(`/api/manager-applications/${applicationId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewerNotes: notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update application");

      alert(`Application ${status} successfully.`);
      setRejectingAppId(null);
      setRejectNotes("");
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Toggle canCreateEnterprise directly on user
  const handleToggleCanCreate = async (targetUserId: string, currentVal: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${targetUserId}/toggle-can-create-enterprise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canCreateEnterprise: !currentVal }),
      });
      if (!res.ok) throw new Error("Failed to toggle permission");

      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, canCreateEnterprise: !currentVal } : u))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center text-slate-500 text-xs">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
        Loading SuperAdmin console...
      </div>
    );
  }

  const pendingApps = applications.filter((a) => a.status === "pending");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-slate-200">
      <TopNav
        user={currentUser}
        activeEnterprise={activeEnterprise}
        enterprises={enterprises}
      />

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-200">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-950">SuperAdmin Platform Console</h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                  Platform Authority
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review Managerial Role Applications, manage user privileges, and inspect platform state.
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Console</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === "applications"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Managerial Applications</span>
            {pendingApps.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                {pendingApps.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === "users"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Access Control</span>
          </button>

          <button
            onClick={() => setActiveTab("enterprises")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === "enterprises"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Platform Enterprises</span>
          </button>
        </div>

        {/* TAB 1: Managerial Role Applications */}
        {activeTab === "applications" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pending Applications ({pendingApps.length})
              </h2>
              <p className="text-xs text-slate-500">
                Users requesting approval to register an enterprise and receive the Manager role.
              </p>
            </div>

            {pendingApps.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs">
                No pending managerial applications at this time.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-950 text-sm">
                            {app.enterpriseName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono">
                            {app.industry}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Applicant: <strong>{app.user?.name}</strong> ({app.user?.email}) • Scale: {app.businessScale}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReviewApplication(app.id, "approved")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Grant Manager</span>
                        </button>

                        <button
                          onClick={() => setRejectingAppId(app.id)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Operational Justification
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                        {app.reason}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      Submitted on: {new Date(app.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Application Archive */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Reviewed Applications Archive
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Applicant</th>
                      <th className="p-3">Enterprise</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Reviewed Date</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applications
                      .filter((a) => a.status !== "pending")
                      .map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/70">
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{app.user?.name}</div>
                            <div className="text-[11px] text-slate-400">{app.user?.email}</div>
                          </td>
                          <td className="p-3 font-medium text-slate-900">{app.enterpriseName}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                app.status === "approved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">
                            {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : "-"}
                          </td>
                          <td className="p-3 text-slate-500 italic">{app.reviewerNotes || "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Users & Access Control */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">User Management & Permissions</h2>
              <p className="text-xs text-slate-500">
                Directly toggle enterprise creation privileges (Manager role eligibility) on any user.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">System Role</th>
                    <th className="p-3">Memberships</th>
                    <th className="p-3">canCreateEnterprise</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === "superadmin"
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">
                        {u.members?.length ? `${u.members.length} Enterprise(s)` : "None"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            u.canCreateEnterprise
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {u.canCreateEnterprise ? "Granted" : "Disabled"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleCanCreate(u.id, u.canCreateEnterprise)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                            u.canCreateEnterprise
                              ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {u.canCreateEnterprise ? "Revoke Creator" : "Grant Creator"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Platform Enterprises */}
        {activeTab === "enterprises" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                All Platform Enterprises ({enterprisesList.length})
              </h2>
              <p className="text-xs text-slate-500">
                Global overview of all registered tenant workspaces and their generated access keys.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enterprisesList.map((ent) => (
                <div
                  key={ent.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-950 text-sm">{ent.name}</span>
                    <span className="text-[10px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {ent.memberCount} members
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">/{ent.slug}</div>
                  <div className="pt-2 border-t border-slate-200/60 font-mono text-xs text-slate-700 select-all">
                    Key: {ent.enterpriseKey}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {rejectingAppId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reject Application</h3>
            <p className="text-xs text-slate-500">
              Provide feedback for the applicant on why this application was not approved.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Insufficient business justification or unverified organization..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingAppId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewApplication(rejectingAppId, "rejected", rejectNotes)}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
