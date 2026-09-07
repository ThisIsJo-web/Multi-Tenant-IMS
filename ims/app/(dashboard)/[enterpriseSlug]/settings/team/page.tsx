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
} from "lucide-react";

export default function TeamSettingsPage() {
  const { activeEnterprise, isManager, isSuperAdmin } = useWorkspace();

  const [staff, setStaff] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
          permissions: ["stock:view", "stock:receive", "stock:transfer"],
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
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition self-start sm:self-auto"
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
                  <span className="text-xs font-bold text-slate-900 block">{req.user?.name}</span>
                  <span className="text-[11px] text-slate-500">{req.user?.email}</span>
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
                <th className="px-6 py-3.5">Joined</th>
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
                        <span className="text-[11px] text-blue-700 font-medium bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Manager Full Access
                        </span>
                      ) : member.permissions && member.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.permissions.map((p: string) => (
                            <span
                              key={p}
                              className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-mono"
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
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {new Date(member.joinedAt || Date.now()).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
